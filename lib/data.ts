// Genera i dati di esempio. Il database viene ricostruito a ogni esercizio:
// piu il livello e alto, piu righe ci sono (cosi non si risolve "a occhio").

export type Column = { name: string; type: "INTEGER" | "REAL" | "TEXT" };

export type Table = {
  name: string;
  columns: Column[];
  rows: (string | number | null)[][];
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pesca<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function prezzoCasuale(): number {
  return Number((Math.random() * 299 + 1).toFixed(2));
}

function dataCasuale(): string {
  const mese = String(randInt(1, 6)).padStart(2, "0");
  const giorno = String(randInt(1, 28)).padStart(2, "0");
  return `2024-${mese}-${giorno}`;
}

// Numero di righe per ogni livello (indice = livello - 1).
const RIGHE = {
  prodotti: [6, 10, 18, 30, 50],
  clienti: [4, 6, 10, 16, 25],
  ordini: [6, 10, 20, 40, 70],
  studenti: [4, 6, 12, 20, 30],
  corsi: [3, 3, 4, 5, 6],
  voti: [6, 12, 25, 45, 80],
};

const NOMI_PRODOTTI = [
  "Tastiera", "Mouse", "Monitor", "Cuffie", "Webcam", "Router", "Stampante",
  "Hard disk", "Chiavetta USB", "Caffe", "Te verde", "Zucchero", "Biscotti",
  "Quaderno", "Penna", "Matita", "Gomma", "Zaino", "Cartella", "Evidenziatore",
];
const CATEGORIE = ["Informatica", "Alimentari", "Cancelleria"];
const COGNOMI = [
  "Rossi", "Bianchi", "Verdi", "Neri", "Russo", "Ferrari", "Esposito",
  "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti",
];
const CITTA = ["Milano", "Roma", "Torino", "Napoli", "Bologna"];
const NOMI_STUDENTI = [
  "Alice", "Bruno", "Carla", "Dario", "Elena", "Franco", "Giulia", "Marco",
  "Sara", "Luca", "Chiara", "Matteo", "Anna", "Paolo", "Laura",
];
const TITOLI_CORSI = ["Matematica", "Informatica", "Storia", "Fisica", "Chimica", "Economia"];

// Crea tutte le tabelle popolate in base al livello (1-5).
export function generaDataset(livello: number): Table[] {
  const i = livello - 1;

  const prodotti: Table = {
    name: "prodotti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "categoria", type: "TEXT" },
      { name: "prezzo", type: "REAL" },
      { name: "scorte", type: "INTEGER" },
    ],
    rows: [],
  };
  for (let k = 1; k <= RIGHE.prodotti[i]; k++) {
    // ogni tanto un prodotto esaurito, cosi le query sulle scorte hanno senso
    const scorte = Math.random() < 0.15 ? 0 : randInt(1, 300);
    prodotti.rows.push([k, pesca(NOMI_PRODOTTI), pesca(CATEGORIE), prezzoCasuale(), scorte]);
  }

  const nClienti = RIGHE.clienti[i];
  const clienti: Table = {
    name: "clienti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "citta", type: "TEXT" },
    ],
    rows: [],
  };
  for (let k = 1; k <= nClienti; k++) {
    clienti.rows.push([k, pesca(COGNOMI), pesca(CITTA)]);
  }

  const ordini: Table = {
    name: "ordini",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "cliente_id", type: "INTEGER" },
      { name: "totale", type: "REAL" },
      { name: "data", type: "TEXT" },
    ],
    rows: [],
  };
  for (let k = 1; k <= RIGHE.ordini[i]; k++) {
    ordini.rows.push([k, randInt(1, nClienti), Number((Math.random() * 290 + 10).toFixed(2)), dataCasuale()]);
  }

  const nStudenti = RIGHE.studenti[i];
  const studenti: Table = {
    name: "studenti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "nome", type: "TEXT" },
      { name: "anno", type: "INTEGER" },
    ],
    rows: [],
  };
  for (let k = 1; k <= nStudenti; k++) {
    studenti.rows.push([k, pesca(NOMI_STUDENTI), randInt(1, 3)]);
  }

  const nCorsi = RIGHE.corsi[i];
  const corsi: Table = {
    name: "corsi",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "titolo", type: "TEXT" },
      { name: "crediti", type: "INTEGER" },
    ],
    rows: [],
  };
  // i titoli sono presi in ordine per restare distinti
  for (let k = 1; k <= nCorsi; k++) {
    corsi.rows.push([k, TITOLI_CORSI[k - 1], pesca([6, 9, 12])]);
  }

  const voti: Table = {
    name: "voti",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "studente_id", type: "INTEGER" },
      { name: "corso_id", type: "INTEGER" },
      { name: "voto", type: "INTEGER" },
    ],
    rows: [],
  };
  for (let k = 1; k <= RIGHE.voti[i]; k++) {
    voti.rows.push([k, randInt(1, nStudenti), randInt(1, nCorsi), randInt(18, 30)]);
  }

  return [prodotti, clienti, ordini, studenti, corsi, voti];
}

// Costruisce lo script di CREATE + INSERT per le tabelle passate.
export function buildSchemaSql(tabelle: Table[]): string {
  const stmts: string[] = [];
  for (const t of tabelle) {
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
