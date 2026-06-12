// Tabelle di esempio caricate nello SQLite in memoria.

export type Column = { name: string; type: "INTEGER" | "REAL" | "TEXT" };

export type Table = {
  name: string;
  columns: Column[];
  rows: (string | number | null)[][];
};

export const TABLES: Table[] = [
  // Facile: una sola tabella
  {
    name: "prodotti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "categoria", type: "TEXT" },
      { name: "prezzo", type: "REAL" },
      { name: "scorte", type: "INTEGER" },
    ],
    rows: [
      [1, "Tastiera", "Informatica", 29.9, 40],
      [2, "Mouse", "Informatica", 15.5, 120],
      [3, "Monitor", "Informatica", 199.0, 12],
      [4, "Caffè", "Alimentari", 4.2, 300],
      [5, "Tè verde", "Alimentari", 3.5, 0],
      [6, "Quaderno", "Cancelleria", 2.0, 80],
      [7, "Penna", "Cancelleria", 1.2, 500],
      [8, "Cuffie", "Informatica", 59.9, 25],
    ],
  },

  // Medio: clienti e ordini
  {
    name: "clienti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "citta", type: "TEXT" },
    ],
    rows: [
      [1, "Rossi", "Milano"],
      [2, "Bianchi", "Roma"],
      [3, "Verdi", "Milano"],
      [4, "Neri", "Torino"],
    ],
  },
  {
    name: "ordini",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "cliente_id", type: "INTEGER" },
      { name: "totale", type: "REAL" },
      { name: "data", type: "TEXT" },
    ],
    rows: [
      [1, 1, 120.0, "2024-01-10"],
      [2, 1, 80.5, "2024-02-15"],
      [3, 2, 50.0, "2024-02-20"],
      [4, 3, 200.0, "2024-03-01"],
      [5, 3, 30.0, "2024-03-05"],
      [6, 4, 15.0, "2024-03-10"],
    ],
  },

  // Difficile: scuola (studenti, corsi, voti)
  {
    name: "studenti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "anno", type: "INTEGER" },
    ],
    rows: [
      [1, "Alice", 1],
      [2, "Bruno", 2],
      [3, "Carla", 1],
      [4, "Dario", 3],
    ],
  },
  {
    name: "corsi",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "titolo", type: "TEXT" },
      { name: "crediti", type: "INTEGER" },
    ],
    rows: [
      [1, "Matematica", 9],
      [2, "Informatica", 6],
      [3, "Storia", 6],
    ],
  },
  {
    name: "voti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "studente_id", type: "INTEGER" },
      { name: "corso_id", type: "INTEGER" },
      { name: "voto", type: "INTEGER" },
    ],
    rows: [
      [1, 1, 1, 28],
      [2, 1, 2, 30],
      [3, 2, 1, 24],
      [4, 2, 3, 26],
      [5, 3, 2, 18],
      [6, 3, 1, 21],
      [7, 4, 2, 30],
    ],
  },
];

export const TABLE_MAP: Record<string, Table> = Object.fromEntries(
  TABLES.map((t) => [t.name, t])
);

// Costruisce lo script di CREATE + INSERT per popolare il database.
export function buildSchemaSql(): string {
  const stmts: string[] = [];
  for (const t of TABLES) {
    const cols = t.columns.map((c) => `${c.name} ${c.type}`).join(", ");
    stmts.push(`CREATE TABLE ${t.name} (${cols});`);
    for (const row of t.rows) {
      const values = row
        .map((v) => (v === null ? "NULL" : typeof v === "number" ? v : `'${String(v).replace(/'/g, "''")}'`))
        .join(", ");
      stmts.push(`INSERT INTO ${t.name} VALUES (${values});`);
    }
  }
  return stmts.join("\n");
}
