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
  tipo: string;
  difficolta: Difficolta;
  domanda: string;
  tabelle: string[];
  operatori: Operatore[];
  soluzione: string;
};

// Una variante è il singolo esercizio prodotto da un generatore.
// "tipo" identifica lo schema (non i valori): serve a non riproporre due
// volte di fila lo stesso esercizio cambiando solo un numero.
type Variante = {
  tipo: string;
  domanda: string;
  soluzione: string;
  tabelle?: string[];
};

type Generatore = {
  difficolta: Difficolta;
  tabelle: string[];
  operatori: Operatore[];
  crea: () => Variante;
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
      const c = pesca([
        () => {
          const cat = pesca(["Informatica", "Alimentari", "Cancelleria"]);
          return { tipo: "cat_eq", sql: `categoria = '${cat}'`, txt: `della categoria '${cat}'` };
        },
        () => {
          const cat = pesca(["Informatica", "Alimentari", "Cancelleria"]);
          return { tipo: "cat_neq", sql: `categoria <> '${cat}'`, txt: `che non sono della categoria '${cat}'` };
        },
        () => {
          const s = pesca([5, 10, 20, 50, 100]);
          return { tipo: "prezzo_gt", sql: `prezzo > ${s}`, txt: `con prezzo maggiore di ${s} euro` };
        },
        () => {
          const s = pesca([5, 10, 20, 50]);
          return { tipo: "prezzo_lt", sql: `prezzo < ${s}`, txt: `con prezzo minore di ${s} euro` };
        },
        () => {
          const s = pesca([10, 50, 100, 200]);
          return { tipo: "scorte_gt", sql: `scorte > ${s}`, txt: `con piu di ${s} pezzi in magazzino` };
        },
        () => ({ tipo: "scorte_zero", sql: `scorte = 0`, txt: `esauriti (scorte a zero)` }),
      ])();
      return {
        tipo: `f_where_${c.tipo}`,
        domanda: `Mostra nome e prezzo dei prodotti ${c.txt}.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE ${c.sql}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["ORDER BY"],
    crea: () => {
      const campo = pesca([
        { c: "prezzo", t: "prezzo" },
        { c: "scorte", t: "quantita in magazzino" },
        { c: "nome", t: "nome" },
      ]);
      const verso = pesca([
        { s: "ASC", t: "crescente" },
        { s: "DESC", t: "decrescente" },
      ]);
      return {
        tipo: `f_order_${campo.c}`,
        domanda: `Elenca i prodotti ordinati per ${campo.t} in ordine ${verso.t}.`,
        soluzione: `SELECT nome, ${campo.c} FROM prodotti ORDER BY ${campo.c} ${verso.s}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "LIKE"],
    crea: () => {
      const l = pesca(["a", "e", "i", "o", "t", "c", "r"]);
      const modo = pesca([
        { tipo: "contiene", sql: `'%${l}%'`, txt: `contiene la lettera '${l}'` },
        { tipo: "inizia", sql: `'${l.toUpperCase()}%'`, txt: `inizia per '${l.toUpperCase()}'` },
        { tipo: "finisce", sql: `'%${l}'`, txt: `finisce per '${l}'` },
      ]);
      return {
        tipo: `f_like_${modo.tipo}`,
        domanda: `Trova i prodotti il cui nome ${modo.txt}.`,
        soluzione: `SELECT nome FROM prodotti WHERE nome LIKE ${modo.sql}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "BETWEEN"],
    crea: () => {
      const campo = pesca([
        { c: "prezzo", t: "prezzo", min: [1, 2, 3], max: [20, 30, 50] },
        { c: "scorte", t: "scorte", min: [10, 20], max: [80, 100, 300] },
      ]);
      const min = pesca(campo.min);
      const max = pesca(campo.max);
      return {
        tipo: `f_between_${campo.c}`,
        domanda: `Mostra i prodotti con ${campo.t} compreso tra ${min} e ${max}.`,
        soluzione: `SELECT nome, ${campo.c} FROM prodotti WHERE ${campo.c} BETWEEN ${min} AND ${max}`,
      };
    },
  },
  {
    difficolta: "facile",
    tabelle: ["prodotti"],
    operatori: ["DISTINCT"],
    crea: () => ({
      tipo: "f_distinct",
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
      const c = pesca([
        () => {
          const citta = pesca(["Milano", "Roma", "Torino"]);
          return { tipo: "citta", sql: `clienti.citta = '${citta}'`, txt: `dei clienti di ${citta}` };
        },
        () => {
          const s = pesca([30, 50, 100]);
          return { tipo: "totale", sql: `ordini.totale > ${s}`, txt: `con totale superiore a ${s} euro` };
        },
        () => {
          const d = pesca(["2024-02-01", "2024-03-01"]);
          return { tipo: "data", sql: `ordini.data >= '${d}'`, txt: `effettuati dal ${d} in poi` };
        },
      ])();
      return {
        tipo: `m_join_${c.tipo}`,
        domanda: `Mostra nome del cliente e totale degli ordini ${c.txt}.`,
        soluzione: `SELECT clienti.nome, ordini.totale FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id WHERE ${c.sql}`,
      };
    },
  },
  {
    difficolta: "medio",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    crea: () => {
      const grp = pesca([
        { by: "clienti.nome", et: "cliente" },
        { by: "clienti.citta", et: "citta" },
      ]);
      const agg = pesca([
        { tipo: "count", fn: "COUNT(ordini.id)", alias: "num_ordini", txt: "il numero di ordini" },
        { tipo: "sum", fn: "SUM(ordini.totale)", alias: "totale", txt: "la spesa totale" },
        { tipo: "avg", fn: "AVG(ordini.totale)", alias: "media", txt: "la spesa media" },
        { tipo: "max", fn: "MAX(ordini.totale)", alias: "massimo", txt: "l'ordine piu alto" },
      ]);
      return {
        tipo: `m_group_${grp.et}_${agg.tipo}`,
        domanda: `Per ogni ${grp.et}, calcola ${agg.txt}.`,
        soluzione: `SELECT ${grp.by} AS ${grp.et}, ${agg.fn} AS ${agg.alias} FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY ${grp.by}`,
      };
    },
  },
  {
    difficolta: "medio",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const c = pesca([
        () => {
          const s = pesca([50, 100, 150]);
          return { tipo: "sum", sel: "SUM(ordini.totale) AS spesa", having: `SUM(ordini.totale) > ${s}`, txt: `hanno speso in totale piu di ${s} euro` };
        },
        () => {
          const n = pesca([1, 2]);
          return { tipo: "count", sel: "COUNT(ordini.id) AS num_ordini", having: `COUNT(ordini.id) > ${n}`, txt: `hanno fatto piu di ${n} ordini` };
        },
        () => {
          const s = pesca([40, 60, 80]);
          return { tipo: "avg", sel: "AVG(ordini.totale) AS media", having: `AVG(ordini.totale) > ${s}`, txt: `hanno una spesa media superiore a ${s} euro` };
        },
      ])();
      return {
        tipo: `m_having_${c.tipo}`,
        domanda: `Mostra i clienti che ${c.txt}.`,
        soluzione: `SELECT clienti.nome, ${c.sel} FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome HAVING ${c.having}`,
      };
    },
  },

  // ---- difficile (studenti, corsi, voti) ----
  {
    difficolta: "difficile",
    tabelle: ["studenti", "corsi", "voti"],
    operatori: ["JOIN", "WHERE"],
    crea: () => {
      return pesca<() => Variante>([
        () => {
          const corso = pesca(["Matematica", "Informatica", "Storia"]);
          return {
            tipo: "d_join_corso",
            domanda: `Mostra nome studente e voto per gli esami del corso di ${corso}.`,
            soluzione: `SELECT studenti.nome, voti.voto FROM voti JOIN studenti ON voti.studente_id = studenti.id JOIN corsi ON voti.corso_id = corsi.id WHERE corsi.titolo = '${corso}'`,
            tabelle: ["studenti", "corsi", "voti"],
          };
        },
        () => {
          const soglia = pesca([24, 26, 28]);
          return {
            tipo: "d_join_voto",
            domanda: `Mostra nome studente e voto per i voti superiori a ${soglia}.`,
            soluzione: `SELECT studenti.nome, voti.voto FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE voti.voto > ${soglia}`,
            tabelle: ["studenti", "voti"],
          };
        },
        () => {
          const anno = pesca([1, 2, 3]);
          return {
            tipo: "d_join_anno",
            domanda: `Mostra nome studente e voto degli studenti del ${anno}° anno.`,
            soluzione: `SELECT studenti.nome, voti.voto FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE studenti.anno = ${anno}`,
            tabelle: ["studenti", "voti"],
          };
        },
      ])();
    },
  },
  {
    difficolta: "difficile",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const c = pesca([
        () => {
          const s = pesca([22, 24, 25, 26]);
          return { tipo: "avg", sel: "AVG(voti.voto) AS media", having: `AVG(voti.voto) >= ${s}`, txt: `media voti maggiore o uguale a ${s}` };
        },
        () => {
          const n = pesca([1, 2]);
          return { tipo: "count", sel: "COUNT(voti.id) AS esami", having: `COUNT(voti.id) > ${n}`, txt: `piu di ${n} esami sostenuti` };
        },
        () => {
          const s = pesca([20, 22, 24]);
          return { tipo: "min", sel: "MIN(voti.voto) AS minimo", having: `MIN(voti.voto) >= ${s}`, txt: `tutti i voti maggiori o uguali a ${s}` };
        },
      ])();
      return {
        tipo: `d_having_${c.tipo}`,
        domanda: `Mostra gli studenti con ${c.txt}.`,
        soluzione: `SELECT studenti.nome, ${c.sel} FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome HAVING ${c.having}`,
      };
    },
  },
  {
    difficolta: "difficile",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "SUBQUERY", "AGGREGATI"],
    crea: () => {
      const sub = pesca([
        { tipo: "avg", fn: "AVG(voto)", op: ">", txt: "superiore alla media generale dei voti" },
        { tipo: "max", fn: "MAX(voto)", op: ">=", txt: "pari al voto massimo registrato" },
        { tipo: "min", fn: "MIN(voto)", op: ">", txt: "superiore al voto piu basso registrato" },
      ]);
      return {
        tipo: `d_sub_${sub.tipo}`,
        domanda: `Trova gli studenti che hanno preso almeno un voto ${sub.txt}.`,
        soluzione: `SELECT DISTINCT studenti.nome FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE voti.voto ${sub.op} (SELECT ${sub.fn} FROM voti)`,
      };
    },
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
  const v = g.crea();
  return {
    id,
    tipo: v.tipo,
    difficolta: g.difficolta,
    tabelle: v.tabelle ?? g.tabelle,
    operatori: g.operatori,
    domanda: v.domanda,
    soluzione: v.soluzione,
  };
}
