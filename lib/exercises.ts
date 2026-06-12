export type Difficolta = "facile" | "medio" | "difficile";

// Operatori che si possono filtrare con le checkbox.
export const OPERATORI = [
  "WHERE",
  "ORDER BY",
  "LIKE",
  "BETWEEN",
  "DISTINCT",
  "JOIN",
  "GROUP BY",
  "HAVING",
  "AGGREGATI",
  "SUBQUERY",
] as const;

export type Operatore = (typeof OPERATORI)[number];

export type Esercizio = {
  id: number;
  difficolta: Difficolta;
  domanda: string;
  tabelle: string[];
  operatori: Operatore[];
  soluzione: string;
};

// Un generatore produce un esercizio diverso a ogni chiamata (parametri casuali).
type Generatore = {
  difficolta: Difficolta;
  tabelle: string[];
  operatori: Operatore[];
  crea: () => { domanda: string; soluzione: string };
};

function pesca<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const GENERATORI: Generatore[] = [
  // ---- facile (tabella prodotti) ----
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE"],
    crea: () => {
      const c = pesca(["Informatica", "Alimentari", "Cancelleria"]);
      return {
        domanda: `Mostra nome e prezzo dei prodotti della categoria '${c}'.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE categoria = '${c}'`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE"],
    crea: () => {
      const s = pesca([5, 10, 20, 50]);
      return {
        domanda: `Mostra nome e prezzo dei prodotti con prezzo maggiore di ${s} euro.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE prezzo > ${s}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["ORDER BY"],
    crea: () => {
      const campo = pesca(["prezzo", "scorte"]);
      const verso = pesca(["ASC", "DESC"]);
      const versoIt = verso === "ASC" ? "crescente" : "decrescente";
      return {
        domanda: `Elenca i prodotti ordinati per ${campo} ${versoIt}.`,
        soluzione: `SELECT nome, ${campo} FROM prodotti ORDER BY ${campo} ${verso}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "LIKE"],
    crea: () => {
      const l = pesca(["a", "e", "i", "o"]);
      return {
        domanda: `Trova i prodotti il cui nome contiene la lettera '${l}'.`,
        soluzione: `SELECT nome FROM prodotti WHERE nome LIKE '%${l}%'`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "BETWEEN"],
    crea: () => {
      const min = pesca([1, 2, 3]);
      const max = pesca([20, 30, 50]);
      return {
        domanda: `Mostra i prodotti con prezzo compreso tra ${min} e ${max} euro.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE prezzo BETWEEN ${min} AND ${max}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["DISTINCT"],
    crea: () => ({
      domanda: "Elenca le categorie distinte presenti tra i prodotti.",
      soluzione: "SELECT DISTINCT categoria FROM prodotti",
    }),
  },

  // ---- medio (clienti + ordini) ----
  {
    difficolta: "medio",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "WHERE"],
    crea: () => {
      const citta = pesca(["Milano", "Roma", "Torino"]);
      return {
        domanda: `Mostra nome del cliente e totale di ogni ordine dei clienti di ${citta}.`,
        soluzione: `SELECT clienti.nome, ordini.totale FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id WHERE clienti.citta = '${citta}'`,
      };
    },
  },
  {
    difficolta: "medio",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    crea: () => {
      const g = pesca([
        { by: "clienti.nome", et: "cliente" },
        { by: "clienti.citta", et: "citta" },
      ]);
      return {
        domanda: `Conta quanti ordini ci sono per ogni ${g.et}.`,
        soluzione: `SELECT ${g.by} AS ${g.et}, COUNT(ordini.id) AS num_ordini FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY ${g.by}`,
      };
    },
  },
  {
    difficolta: "medio",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const s = pesca([50, 100, 150]);
      return {
        domanda: `Mostra i clienti che hanno speso in totale piu di ${s} euro.`,
        soluzione: `SELECT clienti.nome, SUM(ordini.totale) AS spesa FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome HAVING SUM(ordini.totale) > ${s}`,
      };
    },
  },

  // ---- difficile (studenti, corsi, voti) ----
  {
    difficolta: "difficile",
    tabelle: ["studenti", "corsi", "voti"],
    operatori: ["JOIN", "WHERE"],
    crea: () => {
      const corso = pesca(["Matematica", "Informatica", "Storia"]);
      return {
        domanda: `Mostra nome studente e voto per gli esami del corso di ${corso}.`,
        soluzione: `SELECT studenti.nome, voti.voto FROM voti JOIN studenti ON voti.studente_id = studenti.id JOIN corsi ON voti.corso_id = corsi.id WHERE corsi.titolo = '${corso}'`,
      };
    },
  },
  {
    difficolta: "difficile",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const s = pesca([22, 24, 25, 26]);
      return {
        domanda: `Calcola la media voti di ogni studente e mostra solo chi ha media maggiore o uguale a ${s}.`,
        soluzione: `SELECT studenti.nome, AVG(voti.voto) AS media FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome HAVING AVG(voti.voto) >= ${s}`,
      };
    },
  },
  {
    difficolta: "difficile",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "SUBQUERY", "AGGREGATI"],
    crea: () => ({
      domanda: "Trova gli studenti che hanno preso almeno un voto superiore alla media generale dei voti.",
      soluzione:
        "SELECT DISTINCT studenti.nome FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE voti.voto > (SELECT AVG(voto) FROM voti)",
    }),
  },
];

// Generatori che rispettano i filtri scelti (difficolta + operatori ammessi).
export function generatoriCompatibili(
  difficolta: Difficolta[],
  operatori: Operatore[]
): Generatore[] {
  return GENERATORI.filter(
    (g) =>
      difficolta.includes(g.difficolta) &&
      g.operatori.every((op) => operatori.includes(op))
  );
}

// Crea un esercizio pescando a caso tra i generatori passati.
export function nuovoEsercizio(generatori: Generatore[], id: number): Esercizio {
  const g = pesca(generatori);
  const { domanda, soluzione } = g.crea();
  return {
    id,
    difficolta: g.difficolta,
    tabelle: g.tabelle,
    operatori: g.operatori,
    domanda,
    soluzione,
  };
}
