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
  onProgress?: (current: number, total: number) => void
): Promise<EstabelecimentoSaude[]> {
  try {
    console.log(`[CNES] Iniciando extração para município ${codigoMunicipio}`);
    // 1. Buscar lista de estabelecimentos
    const listaUrl = `${CNES_BASE_URL}?municipio=${codigoMunicipio}`;
    console.log(`[CNES] Buscando lista de estabelecimentos: ${listaUrl}`);
    const listaResponse = await axios.get(listaUrl, { headers, timeout: 30000 });
    const listaBasica = listaResponse.data;
    console.log(`[CNES] Recebidos ${listaBasica?.length || 0} estabelecimentos da API`);

    if (!Array.isArray(listaBasica) || listaBasica.length === 0) {
      console.log(`[CNES] Nenhum estabelecimento encontrado`);
      return [];
    }

    // Filtrar apenas estabelecimentos municipais
    const estabelecimentosFiltrados = listaBasica.filter((item: any) => {
      const gestao = item.gestao;
      const natJuridica = String(item.natJuridica || "");
      return gestao === "M" && !natJuridica.startsWith("2");
    });

    const total = estabelecimentosFiltrados.length;
    console.log(`[CNES] Após filtros: ${total} estabelecimentos municipais`);
    const estabelecimentos: EstabelecimentoSaude[] = [];

    // 2. Buscar detalhes de cada estabelecimento
    for (let i = 0; i < estabelecimentosFiltrados.length; i++) {
      const item = estabelecimentosFiltrados[i];
      const idCnes = item.id;
      const cnesCode = item.cnes;

      if (onProgress) {
        onProgress(i + 1, total);
      }

      try {
        // Buscar detalhes
        const detalhesUrl = `${CNES_BASE_URL}/${idCnes}`;
        const detalhesResponse = await axios.get(detalhesUrl, { headers, timeout: 20000 });
        const detalhes = detalhesResponse.data;

        // Buscar horários
        const horariosUrl = `${CNES_BASE_URL}/atendimento/${idCnes}`;
        let horarios: any[] = [];
        try {
          const horariosResponse = await axios.get(horariosUrl, { headers, timeout: 5000 });
          horarios = horariosResponse.data || [];
        } catch (err) {
          // Ignorar erro de horários
        }

        const horariosMap = mapearHorario(horarios);

        // Montar endereço
        const logradouro = formatarTexto(detalhes.noLogradouro);
        const numero = detalhes.nuEndereco || "S/N";
        const bairro = formatarTexto(detalhes.bairro);
        const complemento = formatarTexto(detalhes.noComplemento);
        const complementoStr = complemento ? `, ${complemento}` : "";
        const endereco = `${logradouro}, ${numero}${complementoStr} - ${bairro}`;

        const estabelecimento = {
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
        console.log(`[CNES] ${i + 1}/${total} - ${estabelecimento.nome}`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`[CNES] Erro ao buscar detalhes do estabelecimento ${cnesCode}:`, err);
        // Continuar com próximo
      }
    }

    console.log(`[CNES] Extração concluída: ${estabelecimentos.length} estabelecimentos processados`);
    return estabelecimentos;
  } catch (error) {
    console.error("Erro ao extrair estabelecimentos de saúde:", error);
    throw new Error("Falha ao extrair dados de saúde do CNES");
  }
}
