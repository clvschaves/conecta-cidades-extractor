/**
 * Tipos compartilhados para estabelecimentos públicos
 */

export type EstabelecimentoBase = {
  nome: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  descricao?: string;
  horarioDomingo?: string;
  horarioSegunda?: string;
  horarioTerca?: string;
  horarioQuarta?: string;
  horarioQuinta?: string;
  horarioSexta?: string;
  horarioSabado?: string;
};

export type EstabelecimentoSaude = EstabelecimentoBase & {
  cnes: string;
  tipo: string;
  telefone?: string;
};

export type EstabelecimentoEducacao = EstabelecimentoBase & {
  codigoInep: string;
  tipo: string;
};

export type EstabelecimentoAssistencia = EstabelecimentoBase & {
  tipo: "CRAS" | "CREAS";
};

export type EstabelecimentoFinal = {
  secretaria: string;
  categoria: string;
  classificacaoOriginal: string;
  nome: string;
  endereco: string;
  latitude: string;
  longitude: string;
  descricao: string;
  horarioDomingo: string;
  horarioSegunda: string;
  horarioTerca: string;
  horarioQuarta: string;
  horarioQuinta: string;
  horarioSexta: string;
  horarioSabado: string;
};

export type ProgressUpdate = {
  phase: "saude" | "educacao" | "assistencia" | "geocoding" | "generating" | "completed" | "error";
  message: string;
  current?: number;
  total?: number;
  data?: {
    totalSaude?: number;
    totalEducacao?: number;
    totalAssistencia?: number;
    fileUrl?: string;
    error?: string;
  };
};

export const CATEGORIA_MAP: Record<string, string> = {
  // Saúde - Mapeamentos Específicos e "ok"
  "CENTRO DE SAUDE/UNIDADE BASICA": "Saúde/Centro de Saúde e Unidade Básica",
  "UNIDADE BASICA DE SAUDE": "Saúde/Centro de Saúde e Unidade Básica",
  "POSTO DE SAUDE": "Saúde/Centro de Saúde e Unidade Básica",
  "CENTRO DE APOIO A SAUDE DA FAMILIA": "Saúde/Centro de Apoio à Saúde da Família",
  "CENTRO DE ATENCAO PSICOSSOCIAL": "Saúde/Centro de Atenção Psicossocial (CAPS)",
  "CAPS": "Saúde/Centro de Atenção Psicossocial (CAPS)",
  "CENTRO DE REABILITACAO": "Saúde/Centro de Reabilitação",
  "CLINICA ESPECIALIZADA": "Saúde/Clínica e Centro de Especialidade",
  "CENTRO DE ESPECIALIDADES": "Saúde/Clínica e Centro de Especialidade",
  "HOSPITAL ESPECIALIZADO": "Saúde/Hospital Especializado",
  "HOSPITAL GERAL": "Saúde/Hospital Geral",
  "LABORATORIO": "Saúde/Laboratório de Saúde Pública",
  "POLICLINICA": "Saúde/Policlínica",
  "ACADEMIA DA SAUDE": "Saúde/Polo Academia da Saúde",
  "PRONTO ATENDIMENTO": "Saúde/Pronto Atendimento",
  "UPA": "Saúde/Pronto Atendimento",
  "PRONTO SOCORRO": "Saúde/Pronto Atendimento",
  "CENTRAL DE GESTAO EM SAUDE": "Saúde/Gestão e Regulação",
  "CENTRAL DE REGULACAO DO ACESSO": "Saúde/Gestão e Regulação",
  "CENTRAL DE REGULACAO MEDICA DAS URGENCIAS": "Saúde/Gestão e Regulação",
  "FARMACIA": "Saúde/Assistência Farmacêutica",
  "POLO DE PREVENCAO DE DOENCAS E AGRAVOS E PROMOCAO DA SAUDE": "Saúde/Casa de Apoio",
  "UNIDADE DE APOIO DIAGNOSE E TERAPIA (SADT ISOLADO)": "Saúde/Clínica e Centro de Especialidade",
  "UNIDADE DE ATENCAO A SAUDE INDIGENA": "Saúde/Saúde Indígena",
  "UNIDADE DE VIGILANCIA EM SAUDE": "Saúde/Vigilância em Saúde",
  "UNIDADE MOVEL DE NIVEL PRE-HOSPITALAR NA AREA DE URGENCIA": "Saúde/Urgência e Emergência Móvel",
  "LABORATORIO DE SAUDE PUBLICA": "Saúde/Laboratório de Saúde Pública",
  "LABORATORIO CENTRAL DE SAUDE PUBLICA LACEN": "Saúde/Laboratório de Saúde Pública",
  "CLINICA/CENTRO DE ESPECIALIDADE": "Saúde/Clínica e Centro de Especialidade",

  // Saúde - Exclusões
  "CENTRAL DE ABASTECIMENTO": "REMOVER",
  "CONSULTORIO ISOLADO": "REMOVER",
  "UNIDADE MOVEL FLUVIAL": "REMOVER",
  "UNIDADE MOVEL TERRESTRE": "REMOVER",

  // Educação
  "CRECHE": "Educação/Creches Municipais",
  "ESCOLA": "Educação/Escolas Municipais",
  "BIBLIOTECA": "Educação/Bibliotecas",
  "ANEXO": "Educação/Anexos",

  // Assistência Social
  "CRAS": "Cidadania/CRAS (Centro Regional de Assistência Social)",
  "CREAS": "Cidadania/CREAS (Centro Regional especialistado de Assistência Social)",
};
