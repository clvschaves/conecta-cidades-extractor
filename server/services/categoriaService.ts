import { CATEGORIA_MAP } from "../../shared/estabelecimentos";

/**
 * Serviço para mapear tipos de estabelecimentos para categorias do Conecta Cidades
 */

export function mapearCategoriaSaude(tipo: string): string {
  const tipoNormalizado = tipo
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

  // Buscar match exato
  if (CATEGORIA_MAP[tipoNormalizado]) {
    return CATEGORIA_MAP[tipoNormalizado];
  }

  // Buscar match parcial
  for (const [key, value] of Object.entries(CATEGORIA_MAP)) {
    if (tipoNormalizado.includes(key) || key.includes(tipoNormalizado)) {
      return value;
    }
  }

  // Fallback para tipo genérico de saúde
  if (
    tipoNormalizado.includes("HOSPITAL") ||
    tipoNormalizado.includes("PRONTO") ||
    tipoNormalizado.includes("EMERGENCIA")
  ) {
    return "Saúde/Hospital Geral";
  }

  if (tipoNormalizado.includes("CLINICA") || tipoNormalizado.includes("ESPECIALIDADE")) {
    return "Saúde/Clínica e Centro de Especialidade";
  }

  // Default
  return "Saúde/Centro de Saúde e Unidade Básica";
}

export function mapearCategoriaEducacao(tipo: string): string {
  const tipoNormalizado = tipo
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (CATEGORIA_MAP[tipoNormalizado]) {
    return CATEGORIA_MAP[tipoNormalizado];
  }

  // Buscar match parcial
  for (const [key, value] of Object.entries(CATEGORIA_MAP)) {
    if (tipoNormalizado.includes(key) || key.includes(tipoNormalizado)) {
      return value;
    }
  }

  // Default
  return "Educação/Escolas Municipais";
}

export function mapearCategoriaAssistencia(tipo: "CRAS" | "CREAS"): string {
  return CATEGORIA_MAP[tipo] || "Cidadania/CRAS (Centro Regional de Assistência Social)";
}

export function obterSecretaria(categoria: string): string {
  if (categoria.startsWith("Saúde/")) {
    return "Secretaria Municipal de Saúde";
  } else if (categoria.startsWith("Educação/")) {
    return "Secretaria Municipal de Educação";
  } else if (categoria.startsWith("Cidadania/")) {
    return "Secretaria Municipal de Assistência Social";
  }
  return "Secretaria Municipal";
}
