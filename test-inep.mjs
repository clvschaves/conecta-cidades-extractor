import { extrairEstabelecimentosEducacao } from "./server/services/inepService.ts";

async function test() {
  try {
    console.log("Testando extração INEP...");
    const result = await extrairEstabelecimentosEducacao("2611606");
    console.log("Sucesso! Total:", result.length);
  } catch (error) {
    console.error("Erro:", error.message);
    console.error("Stack:", error.stack);
  }
}

test();
