import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { storagePut } from "./storage";

const MYANMAR_PATTERN = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/;

function detectLanguage(text: string): 'myanmar' | 'english' | 'mixed' {
  const myanmarChars = (text.match(/[\u1000-\u109F]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const total = myanmarChars + englishChars;
  if (total === 0) return 'english';
  const myanmarRatio = myanmarChars / total;
  if (myanmarRatio > 0.5) return 'myanmar';
  if (myanmarRatio > 0.1) return 'mixed';
  return 'english';
}

const MEDICAL_SYSTEM_PROMPT = `You are Medicare Myanmar AI, a medical chat assistant for Myanmar healthcare professionals and patients. You provide accurate, helpful medical information based on Myanmar's healthcare context. 

Rules:
- Respond in the same language as the user's query
- Provide medical information clearly and accurately
- Do NOT include external reference links or URLs in responses
- For serious medical concerns, always recommend consulting a healthcare professional
- Be empathetic and culturally sensitive
- Use appropriate medical terminology in Myanmar or English as needed`;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== Chat Router ====================
  chat: router({
    // List user's chat sessions
    listSessions: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await db.getChatSessionsByUser(ctx.user.id);
      return sessions;
    }),

    // Get messages for a specific session
    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getChatSessionById(input.sessionId, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return db.getChatMessagesBySession(input.sessionId);
      }),

    // Create a new chat session
    createSession: protectedProcedure
      .input(z.object({ title: z.string().optional().default("New Chat") }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createChatSession(ctx.user.id, input.title);
        return { sessionId: result.insertId };
      }),

    // Send a message and get AI response
    sendMessage: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        content: z.string().min(1),
        previousLanguage: z.enum(['myanmar', 'english', 'mixed', 'unknown']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sessionId, content, previousLanguage } = input;

        // Verify session ownership
        const session = await db.getChatSessionById(sessionId, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

        // Detect current language
        const currentLanguage = detectLanguage(content);
        
        // Determine response language
        let responseLang = currentLanguage;
        if (currentLanguage !== previousLanguage && previousLanguage && previousLanguage !== 'unknown') {
          // Language switched - respond in new language
          responseLang = currentLanguage;
        }

        const systemPrompt = responseLang === 'myanmar'
          ? `${MEDICAL_SYSTEM_PROMPT}\n\nAlways respond in Myanmar (Burmese) language.`
          : `${MEDICAL_SYSTEM_PROMPT}\n\nAlways respond in English.`;

        // Get previous messages for context
        const prevMessages = await db.getChatMessagesBySession(sessionId);
        const messageHistory = prevMessages.map(m => ({ role: m.role, content: m.content }));

        // Get RAG context
        let ragContext = "";
        try {
          const chunks = await db.searchDocumentChunks(content.substring(0, 200), ctx.user.id);
          if (chunks.length > 0) {
            ragContext = "Relevant medical context:\n" + chunks.map(c => c.chunkText).join("\n---\n");
          }
        } catch (e) {
          console.warn("RAG search failed:", e);
        }

        // Save user message
        await db.createChatMessage(sessionId, "user", content);

        // Build messages for LLM
        const messages: Array<{ role: string; content: string }> = [
          { role: "system", content: systemPrompt },
        ];

        if (ragContext) {
          messages.push({ role: "system", content: `Medical knowledge base context:\n${ragContext}` });
        }

        // Add history (last 10 messages for context)
        const historyStart = Math.max(0, messageHistory.length - 10);
        messages.push(...messageHistory.slice(historyStart));

        // Add current message
        messages.push({ role: "user", content });

        // Call LLM
        const result = await invokeLLM({
          model: "deepseek-r1-distill-llama-70b",
          messages: messages as any,
        });

        const rawContent = result.choices[0]?.message?.content;
        const aiResponse = typeof rawContent === 'string' 
          ? rawContent 
          : (Array.isArray(rawContent) ? rawContent.map(c => 'text' in c ? c.text : '').join('\n') : '') || "Sorry, I couldn't generate a response.";

        // Save assistant message
        await db.createChatMessage(sessionId, "assistant", aiResponse);

        // Update session timestamp
        await db.updateChatSessionTitle(sessionId, session.title);

        return {
          response: aiResponse,
          detectedLanguage: responseLang,
        };
      }),

    // Delete a chat session
    deleteSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatSession(input.sessionId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== Document Router ====================
  documents: router({
    // List user's documents
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocumentsByUser(ctx.user.id);
    }),

    // Upload a document
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        content: z.string(), // base64 encoded
        mimeType: z.string().optional().default("application/pdf"),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = Buffer.from(input.content, 'base64');
        const fileKey = `${ctx.user.id}/documents/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        const result = await db.createDocument(
          ctx.user.id,
          input.fileName,
          key,
          url,
          fileBuffer.length,
          input.mimeType
        );

        // Process PDF in background (extract text and chunk)
        try {
          await db.updateDocumentStatus(result.insertId, "processing");
          const textContent = extractTextFromBase64(input.content, input.mimeType);
          const chunks = chunkText(textContent, 500);
          await db.createDocumentChunks(result.insertId, chunks);
          await db.updateDocumentStatus(result.insertId, "ready");
        } catch (e) {
          console.error("PDF processing failed:", e);
          await db.updateDocumentStatus(result.insertId, "error");
        }

        return { documentId: result.insertId, url };
      }),

    // Delete a document
    delete: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocument(input.documentId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== Admin Router ====================
  admin: router({
    // Get all users
    getUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    // Get chat statistics
    getStats: adminProcedure.query(async () => {
      return db.getChatStats();
    }),

    // Update user role
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    // Get all chat sessions (admin view)
    getAllSessions: adminProcedure.query(async () => {
      const db_conn = await db.getDb();
      if (!db_conn) return [];
      const { sql: rawSql } = await import("drizzle-orm");
      const sessions = await db_conn.execute(
        rawSql`SELECT cs.*, u.name as userName, u.email as userEmail FROM chat_sessions cs JOIN users u ON cs.userId = u.id ORDER BY cs.updatedAt DESC LIMIT 100`
      );
      return sessions as any[];
    }),

    // Get document management
    getAllDocuments: adminProcedure.query(async () => {
      const db_conn = await db.getDb();
      if (!db_conn) return [];
      const { sql: rawSql } = await import("drizzle-orm");
      const docs = await db_conn.execute(
        rawSql`SELECT d.*, u.name as userName FROM documents d JOIN users u ON d.userId = u.id ORDER BY d.uploadedAt DESC LIMIT 100`
      );
      return docs as any[];
    }),
  }),

  // ==================== Profile Router ====================
  profile: router({
    // Get current user's profile
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      // Merge with user account info
      return {
        profile,
        account: {
          id: ctx.user.id,
          name: ctx.user.name,
          email: ctx.user.email,
          role: ctx.user.role,
          createdAt: ctx.user.createdAt,
        },
      };
    }),

    // Update user profile
    update: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
        bloodType: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        nationality: z.string().optional(),
        occupation: z.string().optional(),
        // Medical information
        allergies: z.string().optional(),
        currentMedications: z.string().optional(),
        chronicConditions: z.string().optional(),
        pastSurgeries: z.string().optional(),
        familyHistory: z.string().optional(),
        medicalNotes: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updatedProfile = await db.upsertUserProfile(ctx.user.id, input);
        return { success: true, profile: updatedProfile };
      }),
  }),

  // ==================== Password Reset Router ====================
  passwordReset: router({
    // Request password reset (generates token)
    requestReset: protectedProcedure
      .input(z.object({}))
      .mutation(async ({ ctx }) => {
        // In a real app, this would generate a token and email it
        // For this demo, we generate a token and return it
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await db.createPasswordResetToken(ctx.user.id, token, expiresAt);
        return { success: true, token };
      }),

    // Verify reset token
    verifyToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const tokenRecord = await db.getPasswordResetTokenByToken(input.token);
        if (!tokenRecord) {
          return { valid: false };
        }
        return { valid: true };
      }),
  }),
});

// Helper: Extract text from base64 content
function extractTextFromBase64(base64Content: string, mimeType: string): string {
  try {
    // For demo purposes, return a placeholder medical text
    // In production, use pdf-parse or similar library
    const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
    // If it's already text, return it
    if (mimeType === 'text/plain' || mimeType === 'text/html') {
      return decoded;
    }
    // For PDFs, return a medical placeholder
    return `Medical Knowledge Base Document

Myanmar Healthcare Guidelines:

1. Primary Care Services
   - Basic health screening and preventive care
   - Maternal and child health services
   - Vaccination programs
   - Infectious disease management

2. Common Medical Conditions in Myanmar
   - Dengue fever prevention and treatment
   - Malaria treatment protocols
   - Tuberculosis screening and treatment
   - Diabetes management guidelines
   - Cardiovascular disease prevention

3. Traditional and Modern Medicine Integration
   - Myanmar traditional medicine practices
   - Integration with modern healthcare systems
   - Herbal medicine guidelines

4. Public Health Programs
   - Community health education
   - Sanitation and hygiene programs
   - Nutrition and food safety
   - Mental health awareness

5. Emergency Services
   - First aid protocols
   - Emergency response coordination
   - Referral system guidelines

Note: This is a simplified knowledge base for demonstration purposes.`;
  } catch {
    return "Medical Knowledge Base Document - Content extraction failed";
  }
}

// Helper: Chunk text into manageable pieces
function chunkText(text: string, chunkSize: number): { chunkText: string; chunkIndex: number }[] {
  const words = text.split(/\s+/);
  const chunks: { chunkText: string; chunkIndex: number }[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const word of words) {
    if (currentChunk.length + word.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ chunkText: currentChunk.trim(), chunkIndex });
      chunkIndex++;
      currentChunk = word + " ";
    } else {
      currentChunk += word + " ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ chunkText: currentChunk.trim(), chunkIndex });
  }

  return chunks;
}

export type AppRouter = typeof appRouter;
