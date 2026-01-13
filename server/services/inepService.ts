import { EstabelecimentoEducacao } from "../../shared/estabelecimentos";

/**
 * Serviço de extração de dados de educação do INEP
 * 
 * Nota: Como os dados do INEP estão em planilhas consolidadas e não há API pública
 * disponível, este serviço retorna dados mockados para demonstração.
 * 
 * Em produção, seria necessário:
 * 1. Fazer download periódico dos arquivos do INEP
 * 2. Armazenar em banco de dados local
 * 3. Consultar por código de município
 */

export async function extrairEstabelecimentosEducacao(
  codigoMunicipio: string,
  onProgress?: (current: number, total: number) => void
): Promise<EstabelecimentoEducacao[]> {
  try {
    console.log(`[INEP] Iniciando extração para município ${codigoMunicipio}`);
    
    // Simular processamento
    if (onProgress) {
      onProgress(1, 1);
    }

    // Por enquanto, retornar array vazio
    // Em produção, aqui seria feita a consulta ao banco de dados local
    // com os dados consolidados do INEP filtrados por município
    
    console.log(`[INEP] Nota: Serviço retorna dados mockados - implementar importação de dados consolidados`);
    
    // Aguardar um pouco para simular processamento
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`[INEP] Extração concluída: 0 estabelecimentos (dados não importados)`);
    return [];
  } catch (error) {
    console.error("Erro ao extrair estabelecimentos de educação:", error);
    throw new Error("Falha ao extrair dados de educação do INEP");
  }
}

/**
 * Função auxiliar para mapear tipo de escola para categoria
 */
export function mapearTipoEscola(tipo: string): string {
  const tipoUpper = tipo.toUpperCase();
  
  if (tipoUpper.includes("CRECHE") || tipoUpper.includes("EMEI")) {
    return "CRECHE";
  } else if (tipoUpper.includes("BIBLIOTECA")) {
    return "BIBLIOTECA";
  } else if (tipoUpper.includes("ANEXO")) {
    return "ANEXO";
  } else {
    return "ESCOLA";
  }
}
