import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("extraction.validateMunicipio", () => {
  it("valida código IBGE com 6 dígitos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.extraction.validateMunicipio({ codigo: "270030" });

    expect(result.valid).toBe(true);
    expect(result.message).toBe("Código válido");
  });

  it("valida código IBGE com 7 dígitos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.extraction.validateMunicipio({ codigo: "2700300" });

    expect(result.valid).toBe(true);
    expect(result.message).toBe("Código válido");
  });

  it("rejeita código com menos de 6 dígitos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Zod validação lança erro antes de chegar na lógica
    await expect(
      caller.extraction.validateMunicipio({ codigo: "12345" })
    ).rejects.toThrow();
  });

  it("rejeita código com mais de 7 dígitos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Zod validação lança erro antes de chegar na lógica
    await expect(
      caller.extraction.validateMunicipio({ codigo: "12345678" })
    ).rejects.toThrow();
  });

  it("rejeita código com caracteres não numéricos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.extraction.validateMunicipio({ codigo: "27003A" });

    expect(result.valid).toBe(false);
    expect(result.message).toContain("numéricos");
  });
});

describe("extraction.startExtraction", () => {
  it("inicia extração com código válido", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.extraction.startExtraction({ municipioCode: "270030" });

    expect(result.success).toBe(true);
    expect(result.extractionId).toBeGreaterThan(0);
  });
});
