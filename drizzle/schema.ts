import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

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
