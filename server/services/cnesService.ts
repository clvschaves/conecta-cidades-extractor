import axios from "axios";
import { EstabelecimentoSaude } from "../../shared/estabelecimentos";

const CNES_BASE_URL = "https://cnes.datasus.gov.br/services/estabelecimentos";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://cnes.datasus.gov.br/",
};

function formatarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .toString()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

function mapearHorario(horarios: any[]): {
  domingo?: string;
  segunda?: string;
  terca?: string;
  quarta?: string;
  quinta?: string;
  sexta?: string;
  sabado?: string;
} {
  const resultado: any = {};

  if (!horarios || horarios.length === 0) return resultado;

  for (const item of horarios) {
    const dia = item.diaSemana || "";
    const inicio = item.hrInicioAtendimento;
    const fim = item.hrFimAtendimento;

    if (inicio && fim) {
      const horarioFmt = `${inicio}-${fim}`;

      if (dia.includes("Domingo")) resultado.domingo = horarioFmt;
      else if (dia.includes("Segunda")) resultado.segunda = horarioFmt;
      else if (dia.includes("Terça") || dia.includes("Terca")) resultado.terca = horarioFmt;
      else if (dia.includes("Quarta")) resultado.quarta = horarioFmt;
      else if (dia.includes("Quinta")) resultado.quinta = horarioFmt;
      else if (dia.includes("Sexta")) resultado.sexta = horarioFmt;
      else if (dia.includes("Sábado") || dia.includes("Sabado")) resultado.sabado = horarioFmt;
    }
  }

  return resultado;
}

export async function extrairEstabelecimentosSaude(
  codigoMunicipio: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<EstabelecimentoSaude[]> {
  try {
    console.log(`\n[CNES] ========================================`);
    console.log(`[CNES] INICIANDO EXTRAÇÃO - Município: ${codigoMunicipio}`);
    console.log(`[CNES] ========================================\n`);

    // 1. Buscar lista de estabelecimentos
    const listaUrl = `${CNES_BASE_URL}?municipio=${codigoMunicipio}`;
    console.log(`[CNES] Buscando lista de estabelecimentos...`);
    
    const listaResponse = await axios.get(listaUrl, { headers, timeout: 15000 });
    const listaBasica = listaResponse.data;

    if (!Array.isArray(listaBasica) || listaBasica.length === 0) {
      console.log(`[CNES] ❌ Nenhum estabelecimento encontrado`);
      return [];
    }

    console.log(`[CNES] 📋 Lista base carregada: ${listaBasica.length} estabelecimentos`);

    // Filtrar apenas estabelecimentos municipais
    const estabelecimentosFiltrados = listaBasica.filter((item: any) => {
      const gestao = item.gestao;
      const natJuridica = String(item.natJuridica || "");
      return gestao === "M" && !natJuridica.startsWith("2");
    });

    const total = estabelecimentosFiltrados.length;
    console.log(`[CNES] 🔍 Após filtros (gestão municipal): ${total} estabelecimentos`);
    console.log(`[CNES] 🚀 Iniciando extração detalhada...\n`);

    const estabelecimentos: EstabelecimentoSaude[] = [];
    let sucessos = 0;
    let falhas = 0;

    // 2. Buscar detalhes de cada estabelecimento
    for (let i = 0; i < estabelecimentosFiltrados.length; i++) {
      const item = estabelecimentosFiltrados[i];
      const idCnes = item.id;
      const cnesCode = item.cnes;
      const nomeLog = formatarTexto(item.noFantasia || "Desconhecido");

      // Log de progresso
      const progressMsg = `[${i + 1}/${total}] ${cnesCode} - ${nomeLog.substring(0, 35).padEnd(35)}`;
      process.stdout.write(`[CNES] ${progressMsg} ... `);

      // Enviar progresso para frontend a cada estabelecimento
      if (onProgress) {
        onProgress(i + 1, total, `[${i + 1}/${total}] ${nomeLog.substring(0, 40)}`);
      }

      try {
        // Buscar detalhes
        const detalhesUrl = `${CNES_BASE_URL}/${idCnes}`;
        const detalhesResponse = await axios.get(detalhesUrl, { headers, timeout: 10000 });
        const detalhes = detalhesResponse.data;

        // Buscar horários
        const horariosUrl = `${CNES_BASE_URL}/atendimento/${idCnes}`;
        let horarios: any[] = [];
        try {
          const horariosResponse = await axios.get(horariosUrl, { headers, timeout: 5000 });
          horarios = horariosResponse.data || [];
        } catch (err) {
          // Ignorar erro de horários - não é crítico
        }

        const horariosMap = mapearHorario(horarios);

        // Montar endereço
        const logradouro = formatarTexto(detalhes.noLogradouro);
        const numero = detalhes.nuEndereco || "S/N";
        const bairro = formatarTexto(detalhes.bairro);
        const complemento = formatarTexto(detalhes.noComplemento);
        const complementoStr = complemento ? `, ${complemento}` : "";
        const endereco = `${logradouro}, ${numero}${complementoStr} - ${bairro}`;

        const estabelecimento: EstabelecimentoSaude = {
          cnes: cnesCode,
          nome: formatarTexto(detalhes.noFantasia),
          tipo: formatarTexto(detalhes.dsTpUnidade),
          endereco,
          telefone: detalhes.nuTelefone,
          horarioDomingo: horariosMap.domingo,
          horarioSegunda: horariosMap.segunda,
          horarioTerca: horariosMap.terca,
          horarioQuarta: horariosMap.quarta,
          horarioQuinta: horariosMap.quinta,
          horarioSexta: horariosMap.sexta,
          horarioSabado: horariosMap.sabado,
        };

        estabelecimentos.push(estabelecimento);
        sucessos++;
        console.log(`✅ OK`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (err) {
        falhas++;
        console.log(`❌ Falha`);
        console.error(`[CNES] Erro ao buscar detalhes do estabelecimento ${cnesCode}:`, err);
        // Continuar com próximo
      }
    }

    console.log(`\n[CNES] ========================================`);
    console.log(`[CNES] ✅ EXTRAÇÃO CONCLUÍDA`);
    console.log(`[CNES] Total processado: ${estabelecimentos.length} estabelecimentos`);
    console.log(`[CNES] Sucessos: ${sucessos} | Falhas: ${falhas}`);
    console.log(`[CNES] ========================================\n`);

    return estabelecimentos;
  } catch (error) {
    console.error("[CNES] ❌ Erro crítico na extração:", error);
    throw new Error("Falha ao extrair dados de saúde do CNES");
  }
}
