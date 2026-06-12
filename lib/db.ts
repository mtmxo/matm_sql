import initSqlJs, { Database, SqlJsStatic } from "sql.js";

let sqlPromise: Promise<SqlJsStatic> | null = null;

// Carica sql.js una volta sola (il .wasm sta in /public).
function getSQL(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
  }
  return sqlPromise;
}

// Crea un database nuovo in memoria a partire da uno script SQL.
export async function creaDatabase(schemaSql: string): Promise<Database> {
  const SQL = await getSQL();
  const db = new SQL.Database();
  db.run(schemaSql);
  return db;
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
