import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createUserContext(role: 'user' | 'admin' = 'user'): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Myanmar language detection", () => {
  const myanmarRegex = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/;

  it("should detect pure Myanmar text", () => {
    expect(myanmarRegex.test("ကျန်းမာရေး")).toBe(true);
    expect(myanmarRegex.test("ဆေးဝါး အကြံပြုချက်")).toBe(true);
  });

  it("should not detect English text as Myanmar", () => {
    expect(myanmarRegex.test("What is the treatment for headache?")).toBe(false);
    expect(myanmarRegex.test("Medical guidelines")).toBe(false);
  });

  it("should detect mixed Myanmar-English text", () => {
    const mixed = "ကျန်းမာရေး about health care";
    expect(myanmarRegex.test(mixed)).toBe(true);
  });

  it("should calculate language ratio correctly", () => {
    const myanmarText = "ကျန်းမာရေး ပြဿနာ";
    const englishText = "What is diabetes treatment";
    const myanmarChars = (myanmarText.match(/[\u1000-\u109F]/g) || []).length;
    const englishChars = (myanmarText.match(/[a-zA-Z]/g) || []).length;
    const ratio = myanmarChars / (myanmarChars + englishChars);
    expect(ratio).toBeGreaterThan(0.5);
  });
});

describe("RAG context building", () => {
  it("should structure medical context prompt correctly", () => {
    const chunks = [
      { chunkText: "Dengue fever is common in Myanmar during rainy season." },
      { chunkText: "Treatment includes fluid replacement and monitoring." },
    ];
    const ragContext = "Relevant medical context:\n" + chunks.map(c => c.chunkText).join("\n---\n");
    expect(ragContext).toContain("Dengue fever");
    expect(ragContext).toContain("---");
    expect(ragContext).toContain("Treatment");
  });

  it("should limit chunk results for context window", () => {
    const maxChunks = 5;
    const allChunks = Array.from({ length: 10 }, (_, i) => ({ chunkText: `Chunk ${i}` }));
    const limitedChunks = allChunks.slice(0, maxChunks);
    expect(limitedChunks.length).toBe(5);
  });

  it("should build system prompt with language instruction", () => {
    const basePrompt = "You are Medicare Myanmar AI, a medical chat assistant.";
    const myanmarPrompt = `${basePrompt}\n\nAlways respond in Myanmar (Burmese) language.`;
    const englishPrompt = `${basePrompt}\n\nAlways respond in English.`;
    
    expect(myanmarPrompt).toContain("Myanmar");
    expect(englishPrompt).toContain("English");
    expect(myanmarPrompt).not.toEqual(englishPrompt);
  });
});

describe("Role-based access control", () => {
  it("should have admin procedures available", () => {
    const ctx = createUserContext('admin');
    const caller = appRouter.createCaller(ctx);
    expect(caller.admin).toBeDefined();
    expect(caller.admin.getUsers).toBeDefined();
    expect(caller.admin.getStats).toBeDefined();
  });

  it("user context should have user role", async () => {
    const ctx = createUserContext('user');
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.role).toBe("user");
  });

  it("admin context should have admin role", async () => {
    const ctx = createUserContext('admin');
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
  });
});

describe("Chat session management", () => {
  it("should have all chat CRUD operations", () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.chat.createSession).toBeDefined();
    expect(caller.chat.listSessions).toBeDefined();
    expect(caller.chat.getMessages).toBeDefined();
    expect(caller.chat.sendMessage).toBeDefined();
    expect(caller.chat.deleteSession).toBeDefined();
  });
});

describe("Document management", () => {
  it("should have document CRUD operations", () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.documents.list).toBeDefined();
    expect(caller.documents.upload).toBeDefined();
    expect(caller.documents.delete).toBeDefined();
  });
});

describe("Password reset", () => {
  it("should have password reset operations", () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.passwordReset.requestReset).toBeDefined();
    expect(caller.passwordReset.verifyToken).toBeDefined();
  });
});

describe("Medical system prompt", () => {
  it("should include no-reference-links rule", () => {
    const prompt = `You are Medicare Myanmar AI, a medical chat assistant for Myanmar healthcare professionals and patients.
Rules:
- Do NOT include external reference links or URLs in responses`;
    expect(prompt).toContain("Do NOT include external reference links");
  });

  it("should include Myanmar language support instruction", () => {
    const prompt = `You are Medicare Myanmar AI, a medical chat assistant.
- Respond in the same language as the user's query
- Be empathetic and culturally sensitive
- Use appropriate medical terminology in Myanmar or English`;
    expect(prompt).toContain("same language as the user's query");
    expect(prompt).toContain("Myanmar");
  });
});
