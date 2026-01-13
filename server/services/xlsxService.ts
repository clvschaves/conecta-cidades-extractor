import ExcelJS from "exceljs";
import { EstabelecimentoFinal } from "../../shared/estabelecimentos";
import { storagePut } from "../storage";

/**
 * Serviço para geração de arquivo XLSX no formato Conecta Cidades
 */

export async function gerarArquivoXLSX(
  estabelecimentos: EstabelecimentoFinal[],
  municipioCode: string
): Promise<{ url: string; key: string }> {
  try {
    // Criar workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planilha1");

    // Definir colunas
    worksheet.columns = [
      { header: "Secretaria / Órgão", key: "secretaria", width: 40 },
      { header: "Categoria/Subcategoria", key: "categoria", width: 50 },
      { header: "Nome", key: "nome", width: 60 },
      { header: "Endereço", key: "endereco", width: 60 },
      { header: "Latitude", key: "latitude", width: 15 },
      { header: "Longitude", key: "longitude", width: 15 },
      { header: "Descrição", key: "descricao", width: 40 },
      { header: "Horário Domingo", key: "horarioDomingo", width: 20 },
      { header: "Horário Segunda", key: "horarioSegunda", width: 20 },
      { header: "Horário Terça", key: "horarioTerca", width: 20 },
      { header: "Horário Quarta", key: "horarioQuarta", width: 20 },
      { header: "Horário Quinta", key: "horarioQuinta", width: 20 },
      { header: "Horário Sexta", key: "horarioSexta", width: 20 },
      { header: "Horário Sábado", key: "horarioSabado", width: 20 },
    ];

    // Adicionar dados
    estabelecimentos.forEach((est) => {
      worksheet.addRow({
        secretaria: est.secretaria,
        categoria: est.categoria,
        nome: est.nome,
        endereco: est.endereco,
        latitude: est.latitude,
        longitude: est.longitude,
        descricao: est.descricao,
        horarioDomingo: est.horarioDomingo,
        horarioSegunda: est.horarioSegunda,
        horarioTerca: est.horarioTerca,
        horarioQuarta: est.horarioQuarta,
        horarioQuinta: est.horarioQuinta,
        horarioSexta: est.horarioSexta,
        horarioSabado: est.horarioSabado,
      });
    });

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload para S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileKey = `extractions/${municipioCode}-${timestamp}-${randomSuffix}.xlsx`;

    const result = await storagePut(
      fileKey,
      new Uint8Array(buffer),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return {
      url: result.url,
      key: fileKey,
    };
  } catch (error) {
    console.error("Erro ao gerar arquivo XLSX:", error);
    throw new Error("Falha ao gerar arquivo XLSX");
  }
}
