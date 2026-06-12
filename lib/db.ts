import initSqlJs, { Database } from "sql.js";
import { buildSchemaSql } from "./data";

let dbPromise: Promise<Database> | null = null;

// Carica sql.js (il file .wasm arriva dal CDN) e crea il database in memoria.
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initSqlJs({
      locateFile: (f) => `https://sql.js.org/dist/${f}`,
    }).then((SQL) => {
      const db = new SQL.Database();
      db.run(buildSchemaSql());
      return db;
    });
  }
  return dbPromise;
}

export type QueryResult = {
  columns: string[];
  rows: (string | number | null)[][];
};

// Esegue una query e restituisce colonne + righe del primo result set.
export function runQuery(db: Database, sql: string): QueryResult {
  const res = db.exec(sql);
  if (res.length === 0) {
    return { columns: [], rows: [] };
  }
  return {
    columns: res[0].columns,
    rows: res[0].values as (string | number | null)[][],
  };
}
