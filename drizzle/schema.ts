import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de municípios brasileiros para mapeamento de código IBGE
 */
export const municipios = mysqlTable("municipios", {
  id: int("id").autoincrement().primaryKey(),
  codigoIbge: varchar("codigoIbge", { length: 7 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Municipio = typeof municipios.$inferSelect;
export type InsertMunicipio = typeof municipios.$inferInsert;

/**
 * Tabela de escolas (INEP)
 */
export const escolas = mysqlTable("escolas", {
  id: int("id").autoincrement().primaryKey(),
  codigoInep: varchar("codigoInep", { length: 20 }).notNull().unique(),
  nome: varchar("nome", { length: 500 }).notNull(),
  municipio: varchar("municipio", { length: 255 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  endereco: text("endereco"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  restricaoAtendimento: text("restricaoAtendimento"),
  localizacao: varchar("localizacao", { length: 100 }),
  categoriaAdministrativa: varchar("categoriaAdministrativa", { length: 100 }),
  telefone: varchar("telefone", { length: 50 }),
  dependenciaAdministrativa: varchar("dependenciaAdministrativa", { length: 100 }),
  porteEscola: varchar("porteEscola", { length: 100 }),
  etapasModalidade: text("etapasModalidade"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Escola = typeof escolas.$inferSelect;
export type InsertEscola = typeof escolas.$inferInsert;

/**
 * Tabela de equipamentos de assistência social (SUAS)
 */
export const equipamentosAssistencia = mysqlTable("equipamentosAssistencia", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // CRAS ou CREAS
  nome: varchar("nome", { length: 500 }).notNull(),
  municipio: varchar("municipio", { length: 255 }).notNull(),
  endereco: text("endereco"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EquipamentoAssistencia = typeof equipamentosAssistencia.$inferSelect;
export type InsertEquipamentoAssistencia = typeof equipamentosAssistencia.$inferInsert;

/**
 * Tabela para histórico de extrações realizadas
 */
export const extractions = mysqlTable("extractions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  municipioCode: varchar("municipioCode", { length: 7 }).notNull(),
  municipioName: varchar("municipioName", { length: 255 }),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  totalSaude: int("totalSaude").default(0),
  totalEducacao: int("totalEducacao").default(0),
  totalAssistencia: int("totalAssistencia").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Extraction = typeof extractions.$inferSelect;
export type InsertExtraction = typeof extractions.$inferInsert;
