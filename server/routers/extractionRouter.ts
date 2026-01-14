import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { extrairEstabelecimentosSaude } from "../services/cnesService";
import { extrairEstabelecimentosEducacao } from "../services/inepService";
import { extrairEstabelecimentosAssistencia } from "../services/suasService";
import { geocodificarLote } from "../services/geocodingService";
import {
  mapearCategoriaSaude,
  mapearCategoriaEducacao,
  mapearCategoriaAssistencia,
  obterSecretaria,
} from "../services/categoriaService";
import { gerarArquivoXLSX } from "../services/xlsxService";
import { EstabelecimentoFinal } from "../../shared/estabelecimentos";
import { getDb } from "../db";
import { extractions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const extractionRouter = router({
  /**
   * Validar código IBGE do município
   */
  validateMunicipio: protectedProcedure
    .input(
      z.object({
        codigo: z.string().min(6).max(7),
      })
    )
    .query(async ({ input }) => {
      const codigo = input.codigo.trim();

      // Validar formato (6 ou 7 dígitos numéricos)
      if (!/^\d{6,7}$/.test(codigo)) {
        return {
          valid: false,
          message: "Código IBGE deve conter 6 ou 7 dígitos numéricos",
        };
      }

      return {
        valid: true,
        message: "Código válido",
      };
    }),

  /**
   * Iniciar extração de dados
   */
  startExtraction: protectedProcedure
    .input(
      z.object({
        municipioCode: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { municipioCode } = input;
      const userId = ctx.user.id;

      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database não disponível");
        }

        // Criar registro de extração
        const [extraction] = await db.insert(extractions).values({
          userId,
          municipioCode,
          status: "processing",
        });

        const extractionId = extraction.insertId;

        // Processar em background (não bloquear a resposta)
        processExtraction(extractionId, municipioCode, userId).catch((err) => {
          console.error("Erro no processamento da extração:", err);
        });

        return {
          success: true,
          extractionId: Number(extractionId),
        };
      } catch (error) {
        console.error("Erro ao iniciar extração:", error);
        throw new Error("Falha ao iniciar extração");
      }
    }),

  /**
   * Obter status da extração
   */
  getExtractionStatus: protectedProcedure
    .input(
      z.object({
        extractionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database não disponível");
      }

      const [extraction] = await db
        .select()
        .from(extractions)
        .where(eq(extractions.id, input.extractionId))
        .limit(1);

      if (!extraction) {
        throw new Error("Extração não encontrada");
      }

      return extraction;
    }),

  /**
   * Listar extrações do usuário
   */
  listExtractions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const results = await db
      .select()
      .from(extractions)
      .where(eq(extractions.userId, ctx.user.id))
      .orderBy(desc(extractions.createdAt))
      .limit(20);

    return results;
  }),
});

/**
 * Função auxiliar para processar extração em background
 */
async function processExtraction(
  extractionId: number,
  municipioCode: string,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database não disponível");
  }

  try {
    console.log(`\n========================================`);
    console.log(`[${extractionId}] INICIANDO EXTRAÇÃO - Município: ${municipioCode}`);
    console.log(`========================================\n`);

    // 1. Extrair dados de saúde
    console.log(`[${extractionId}] ===== FASE 1: SAÚDE =====`);
    const estabelecimentosSaude = await extrairEstabelecimentosSaude(
      municipioCode,
      (current, total, message) => {
        console.log(`[${extractionId}] CNES: ${message} (${current}/${total})`);
      }
    );
    console.log(`[${extractionId}] ✓ Saúde concluída: ${estabelecimentosSaude.length} estabelecimentos\n`);

    // 2. Extrair dados de educação
    console.log(`[${extractionId}] ===== FASE 2: EDUCAÇÃO =====`);
    const estabelecimentosEducacao = await extrairEstabelecimentosEducacao(municipioCode);
    console.log(`[${extractionId}] ✓ Educação concluída: ${estabelecimentosEducacao.length} estabelecimentos\n`);

    // 3. Extrair dados de assistência social
    console.log(`[${extractionId}] ===== FASE 3: ASSISTÊNCIA SOCIAL =====`);
    const estabelecimentosAssistencia = await extrairEstabelecimentosAssistencia(municipioCode);
    console.log(`[${extractionId}] ✓ Assistência concluída: ${estabelecimentosAssistencia.length} estabelecimentos\n`);

    // 4. Mapear para formato final
    console.log(`[${extractionId}] ===== FASE 4: MAPEAMENTO =====`);
    const estabelecimentosFinais: EstabelecimentoFinal[] = [];

    // Mapear saúde
    for (const est of estabelecimentosSaude) {
      const categoria = mapearCategoriaSaude(est.tipo);
      estabelecimentosFinais.push({
        secretaria: obterSecretaria(categoria),
        categoria,
        nome: est.nome,
        endereco: est.endereco,
        latitude: est.latitude?.toString() || "",
        longitude: est.longitude?.toString() || "",
        descricao: est.descricao || "",
        horarioDomingo: est.horarioDomingo || "",
        horarioSegunda: est.horarioSegunda || "",
        horarioTerca: est.horarioTerca || "",
        horarioQuarta: est.horarioQuarta || "",
        horarioQuinta: est.horarioQuinta || "",
        horarioSexta: est.horarioSexta || "",
        horarioSabado: est.horarioSabado || "",
      });
    }

    // Mapear educação
    for (const est of estabelecimentosEducacao) {
      const categoria = mapearCategoriaEducacao(est.tipo);
      estabelecimentosFinais.push({
        secretaria: obterSecretaria(categoria),
        categoria,
        nome: est.nome,
        endereco: est.endereco,
        latitude: est.latitude?.toString() || "",
        longitude: est.longitude?.toString() || "",
        descricao: est.descricao || "",
        horarioDomingo: est.horarioDomingo || "",
        horarioSegunda: est.horarioSegunda || "",
        horarioTerca: est.horarioTerca || "",
        horarioQuarta: est.horarioQuarta || "",
        horarioQuinta: est.horarioQuinta || "",
        horarioSexta: est.horarioSexta || "",
        horarioSabado: est.horarioSabado || "",
      });
    }

    // Mapear assistência
    for (const est of estabelecimentosAssistencia) {
      const categoria = mapearCategoriaAssistencia(est.tipo);
      estabelecimentosFinais.push({
        secretaria: obterSecretaria(categoria),
        categoria,
        nome: est.nome,
        endereco: est.endereco,
        latitude: est.latitude?.toString() || "",
        longitude: est.longitude?.toString() || "",
        descricao: est.descricao || "",
        horarioDomingo: est.horarioDomingo || "",
        horarioSegunda: est.horarioSegunda || "",
        horarioTerca: est.horarioTerca || "",
        horarioQuarta: est.horarioQuarta || "",
        horarioQuinta: est.horarioQuinta || "",
        horarioSexta: est.horarioSexta || "",
        horarioSabado: est.horarioSabado || "",
      });
    }

    // 5. Geocodificação removida - aceitar apenas endereço
    console.log(`[${extractionId}] Geocodificação desabilitada - mantendo apenas endereços`);

    console.log(`[${extractionId}] Total de estabelecimentos mapeados: ${estabelecimentosFinais.length}\n`);

    // 6. Gerar arquivo XLSX
    console.log(`[${extractionId}] ===== FASE 5: GERAÇÃO XLSX =====`);
    const { url, key } = await gerarArquivoXLSX(estabelecimentosFinais, municipioCode);
    console.log(`[${extractionId}] ✓ Arquivo XLSX gerado com sucesso`);

    // 7. Atualizar registro
    await db
      .update(extractions)
      .set({
        status: "completed",
        fileUrl: url,
        fileKey: key,
        totalSaude: estabelecimentosSaude.length,
        totalEducacao: estabelecimentosEducacao.length,
        totalAssistencia: estabelecimentosAssistencia.length,
        completedAt: new Date(),
      })
      .where(eq(extractions.id, extractionId));

    console.log(`\n========================================`);
    console.log(`[${extractionId}] ✓✓✓ EXTRAÇÃO CONCLUÍDA COM SUCESSO ✓✓✓`);
    console.log(`[${extractionId}] Total: ${estabelecimentosSaude.length} saúde + ${estabelecimentosEducacao.length} educação + ${estabelecimentosAssistencia.length} assistência`);
    console.log(`[${extractionId}] Arquivo disponível em: ${url}`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error(`[${extractionId}] Erro na extração:`, error);

    // Atualizar status como falha
    await db
      .update(extractions)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      })
      .where(eq(extractions.id, extractionId));
  }
}
