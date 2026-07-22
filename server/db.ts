import { eq, desc, and, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { chatSessions, chatMessages, documents, documentChunks, passwordResetTokens, userProfiles, InsertUserProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== Chat Sessions ====================

export async function createChatSession(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({ userId, title });
  return { insertId: result[0].insertId };
}

export async function getChatSessionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(50);
}

export async function getChatSessionById(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChatSessionTitle(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ title }).where(eq(chatSessions.id, sessionId));
}

export async function deleteChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}

// ==================== Chat Messages ====================

export async function createChatMessage(sessionId: number, role: 'user' | 'assistant' | 'system', content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values({ sessionId, role, content });
  return { insertId: result[0].insertId };
}

export async function getChatMessagesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

// ==================== Documents ====================

export async function createDocument(userId: number, fileName: string, fileKey: string, fileUrl: string, fileSize: number, mimeType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values({ userId, fileName, fileKey, fileUrl, fileSize, mimeType, status: "uploading" });
  return { insertId: result[0].insertId };
}

export async function getDocumentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.uploadedAt));
}

export async function updateDocumentStatus(documentId: number, status: 'uploading' | 'processing' | 'ready' | 'error') {
  const db = await getDb();
  if (!db) return;
  await db.update(documents).set({ status, processedAt: status === 'ready' ? new Date() : undefined }).where(eq(documents.id, documentId));
}

export async function deleteDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));
  await db.delete(documents).where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
}

// ==================== Document Chunks ====================

export async function createDocumentChunks(documentId: number, chunks: { chunkText: string; chunkIndex: number }[]) {
  const db = await getDb();
  if (!db) return;
  for (const chunk of chunks) {
    await db.insert(documentChunks).values({ documentId, chunkText: chunk.chunkText, chunkIndex: chunk.chunkIndex });
  }
}

export async function getDocumentChunksByDocument(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentChunks).where(eq(documentChunks.documentId, documentId)).orderBy(documentChunks.chunkIndex);
}

export async function searchDocumentChunks(query: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Simple LIKE-based search across all user's document chunks
  const searchPattern = `%${query}%`;
  return db.select({
    chunkText: documentChunks.chunkText,
    documentId: documentChunks.documentId,
  })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(
      eq(documents.userId, userId),
      eq(documents.status, 'ready'),
      sql`document_chunks.chunkText LIKE ${searchPattern}`
    ))
    .limit(5);
}

// ==================== Password Reset ====================

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens).where(and(
    eq(passwordResetTokens.token, token),
    eq(passwordResetTokens.used, 'no'),
    gt(passwordResetTokens.expiresAt, new Date())
  )).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({ used: 'yes' }).where(eq(passwordResetTokens.id, id));
}

// ==================== Admin Stats ====================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getChatStats() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalMessages: 0, totalUsers: 0 };
  const [sessionsResult, messagesResult, usersResult] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(chatSessions),
    db.select({ count: sql<number>`COUNT(*)` }).from(chatMessages),
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
  ]);
  return {
    totalSessions: sessionsResult[0]?.count ?? 0,
    totalMessages: messagesResult[0]?.count ?? 0,
    totalUsers: usersResult[0]?.count ?? 0,
  };
}

export async function updateUserRole(userId: number, role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ==================== User Profile ====================

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserProfile(userId: number, profile: Partial<InsertUserProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserProfile(userId);

  const data = { ...profile, userId };
  // Remove undefined values
  Object.keys(data).forEach(key => {
    if (data[key as keyof typeof data] === undefined) {
      delete data[key as keyof typeof data];
    }
  });

  if (existing) {
    await db.update(userProfiles).set(data as any).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values(data as any);
  }

  return getUserProfile(userId);
}
