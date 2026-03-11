import { eq, sql } from "drizzle-orm";
import { getDb } from "./server/db.js";
import { escolas, equipamentosAssistencia, municipios } from "./drizzle/schema.js";

async function test() {
    try {
        const db = await getDb();

        const m = await db.select({ count: sql`count(*)` }).from(municipios);
        const e = await db.select({ count: sql`count(*)` }).from(escolas);
        const ea = await db.select({ count: sql`count(*)` }).from(equipamentosAssistencia);

        console.log("Municipios count:", m);
        console.log("Escolas count:", e);
        console.log("Equipamentos count:", ea);

        // Fetch SUAS for porto velho
        const pv = await db.select().from(equipamentosAssistencia).where(sql`municipio LIKE '%Porto Velho%'`);
        console.log("SUAS Porto Velho:", pv.length);

        // Fetch escolas for porto velho
        const ev = await db.select().from(escolas).where(sql`municipio LIKE '%Porto Velho%'`);
        console.log("Escolas Porto Velho:", ev.length);

        // Let's see any sample of schools for Porto Velho:
        console.log("Sample school for Porto Velho:", ev[0]);

        process.exit(0);
    } catch (error) {
        console.error(error);
    }
}
test();
