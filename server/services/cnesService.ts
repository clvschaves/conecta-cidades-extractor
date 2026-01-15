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
  const logFrontend = (msg: string) => {
    console.log(msg);
    if (onProgress) {
      onProgress(0, 0, msg);
    }
  };

  try {
    logFrontend(`\n========================================`);
    logFrontend(`🚀 INICIANDO EXTRAÇÃO CNES`);
    logFrontend(`Município: ${codigoMunicipio}`);
    logFrontend(`========================================\n`);

    // Normalizar código: API CNES aceita apenas 6 dígitos (sem dígito verificador)
    const codigoNormalizado = codigoMunicipio.length === 7 
      ? codigoMunicipio.substring(0, 6) 
      : codigoMunicipio;
    
    logFrontend(`📝 Código original: ${codigoMunicipio}`);
    logFrontend(`📝 Código normalizado: ${codigoNormalizado}`);

    // 1. Buscar lista de estabelecimentos
    const listaUrl = `${CNES_BASE_URL}?municipio=${codigoNormalizado}`;
    logFrontend(`\n🌐 Fazendo requisição HTTP GET...`);
    logFrontend(`URL: ${listaUrl}`);
    logFrontend(`Timeout: 15 segundos`);
    
    const inicioReq = Date.now();
    let listaResponse;
    try {
      listaResponse = await axios.get(listaUrl, { headers, timeout: 15000 });
      const tempoReq = Date.now() - inicioReq;
      logFrontend(`✅ Resposta recebida em ${tempoReq}ms`);
      logFrontend(`Status HTTP: ${listaResponse.status}`);
    } catch (error: any) {
      const tempoReq = Date.now() - inicioReq;
      logFrontend(`❌ Erro na requisição após ${tempoReq}ms`);
      logFrontend(`Erro: ${error.message}`);
      if (error.code) logFrontend(`Código: ${error.code}`);
      throw error;
    }
    
    const listaBasica = listaResponse.data;

    if (!Array.isArray(listaBasica)) {
      logFrontend(`❌ Resposta não é um array`);
      logFrontend(`Tipo recebido: ${typeof listaBasica}`);
      return [];
    }

    if (listaBasica.length === 0) {
      logFrontend(`⚠️ Nenhum estabelecimento encontrado para este município`);
      return [];
    }

    logFrontend(`\n📋 Lista recebida: ${listaBasica.length} estabelecimentos`);

    // Filtrar apenas estabelecimentos municipais
    logFrontend(`\n🔍 Aplicando filtros...`);
    logFrontend(`Filtro 1: gestao === "M" (gestão municipal)`);
    logFrontend(`Filtro 2: natJuridica !== "2*" (excluir privados)`);
    
    const estabelecimentosFiltrados = listaBasica.filter((item: any) => {
      const gestao = item.gestao;
      const natJuridica = String(item.natJuridica || "");
      return gestao === "M" && !natJuridica.startsWith("2");
    });

    const total = estabelecimentosFiltrados.length;
    logFrontend(`✅ Após filtros: ${total} estabelecimentos municipais`);
    
    if (total === 0) {
      logFrontend(`⚠️ Nenhum estabelecimento municipal encontrado`);
      return [];
    }

    logFrontend(`\n🚀 Iniciando extração detalhada de ${total} estabelecimentos...\n`);

    const estabelecimentos: EstabelecimentoSaude[] = [];
    let sucessos = 0;
    let falhas = 0;

    // 2. Buscar detalhes de cada estabelecimento
    for (let i = 0; i < estabelecimentosFiltrados.length; i++) {
      const item = estabelecimentosFiltrados[i];
      const idCnes = item.id;
      const cnesCode = item.cnes;
      const nomeLog = formatarTexto(item.noFantasia || "Desconhecido");

      const progressMsg = `[${i + 1}/${total}] ${cnesCode} - ${nomeLog.substring(0, 40)}`;
      logFrontend(progressMsg);

      try {
        // Buscar detalhes
        const detalhesUrl = `${CNES_BASE_URL}/${idCnes}`;
        logFrontend(`  → GET ${detalhesUrl}`);
        
        const inicioDetalhes = Date.now();
        const detalhesResponse = await axios.get(detalhesUrl, { headers, timeout: 10000 });
        const tempoDetalhes = Date.now() - inicioDetalhes;
        logFrontend(`  ✓ Detalhes recebidos em ${tempoDetalhes}ms`);
        
        const detalhes = detalhesResponse.data;

        // Buscar horários
        const horariosUrl = `${CNES_BASE_URL}/atendimento/${idCnes}`;
        let horarios: any[] = [];
        try {
          logFrontend(`  → GET ${horariosUrl}`);
          const horariosResponse = await axios.get(horariosUrl, { headers, timeout: 5000 });
          horarios = horariosResponse.data || [];
          logFrontend(`  ✓ Horários recebidos`);
        } catch (err) {
          logFrontend(`  ⚠️ Horários não disponíveis (não crítico)`);
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
        logFrontend(`  ✅ Sucesso!\n`);

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (err: any) {
        falhas++;
        logFrontend(`  ❌ Falha: ${err.message}`);
        if (err.code) logFrontend(`  Código: ${err.code}`);
        logFrontend(``);
        // Continuar com próximo
      }
    }

    logFrontend(`\n========================================`);
    logFrontend(`✅ EXTRAÇÃO CONCLUÍDA`);
    logFrontend(`Total processado: ${estabelecimentos.length}`);
    logFrontend(`Sucessos: ${sucessos} | Falhas: ${falhas}`);
    logFrontend(`========================================\n`);

    return estabelecimentos;
  } catch (error: any) {
    logFrontend(`\n❌ ERRO CRÍTICO NA EXTRAÇÃO`);
    logFrontend(`Mensagem: ${error.message}`);
    if (error.code) logFrontend(`Código: ${error.code}`);
    if (error.response) {
      logFrontend(`Status HTTP: ${error.response.status}`);
      logFrontend(`Dados: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    throw new Error("Falha ao extrair dados de saúde do CNES");
  }
}
