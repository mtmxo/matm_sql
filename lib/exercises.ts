// Operatori filtrabili con le checkbox. Funzionano come "tetto": un esercizio
// compare solo se usa esclusivamente operatori spuntati. Cosi chi studia un
// operatore alla volta non si trova davanti cose che non ha ancora imparato.
export const OPERATORI = [
  "WHERE",
  "ORDER BY",
  "LIKE",
  "BETWEEN",
  "IN",
  "IS NULL",
  "DISTINCT",
  "JOIN",
  "LEFT JOIN",
  "GROUP BY",
  "HAVING",
  "AGGREGATI",
  "CASE",
  "LIMIT",
  "SUBQUERY",
] as const;

export type Operatore = (typeof OPERATORI)[number];

// Operatori "richiesti" da un altro: LIKE/BETWEEN vivono dentro un WHERE,
// GROUP BY ha bisogno di un aggregato, HAVING di GROUP BY, ecc.
export const DIPENDENZE: Record<Operatore, Operatore[]> = {
  "WHERE": [],
  "ORDER BY": [],
  "LIKE": ["WHERE"],
  "BETWEEN": ["WHERE"],
  "IN": ["WHERE"],
  "IS NULL": ["WHERE"],
  "DISTINCT": [],
  "JOIN": [],
  "LEFT JOIN": [],
  "GROUP BY": ["AGGREGATI"],
  "HAVING": ["GROUP BY", "AGGREGATI"],
  "AGGREGATI": [],
  "CASE": [],
  "LIMIT": ["ORDER BY"],
  "SUBQUERY": ["WHERE", "AGGREGATI"],
};

// Espande una lista di operatori includendo (in modo ricorsivo) le dipendenze.
export function conDipendenze(operatori: Operatore[]): Operatore[] {
  const trovati = new Set<Operatore>();
  const aggiungi = (op: Operatore) => {
    if (trovati.has(op)) return;
    trovati.add(op);
    DIPENDENZE[op].forEach(aggiungi);
  };
  operatori.forEach(aggiungi);
  return OPERATORI.filter((o) => trovati.has(o));
}

// I 5 livelli, da chi parte da zero a chi e esperto.
export const LIVELLI = [
  { n: 1, nome: "Principiante" },
  { n: 2, nome: "Base" },
  { n: 3, nome: "Intermedio" },
  { n: 4, nome: "Avanzato" },
  { n: 5, nome: "Esperto" },
];

export type Esercizio = {
  id: number;
  tipo: string;
  tema: string;
  livello: number;
  domanda: string;
  tabelle: string[];
  operatori: Operatore[];
  soluzione: string;
};

// Il tema (dominio) di un esercizio in base alle tabelle che usa.
function temaDa(tabelle: string[]): string {
  if (tabelle.some((t) => t === "studenti" || t === "corsi" || t === "voti")) return "scuola";
  if (tabelle.some((t) => t === "clienti" || t === "ordini")) return "ordini";
  return "prodotti";
}

// "tipo" identifica lo schema dell'esercizio (non i valori): serve a non
// riproporre due volte di fila la stessa query con solo un numero diverso.
type Variante = {
  tipo: string;
  domanda: string;
  soluzione: string;
  tabelle?: string[];
};

type Generatore = {
  livello: number;
  tabelle: string[];
  operatori: Operatore[];
  crea: () => Variante;
};

function pesca<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const GENERATORI: Generatore[] = [
  // ===== Livello 1: una tabella, SELECT con WHERE semplice o ORDER BY =====
  {
    livello: 1,
    tabelle: ["prodotti"],
    operatori: ["WHERE"],
    crea: () => {
      const c = pesca([
        () => {
          const cat = pesca(["Informatica", "Alimentari", "Cancelleria"]);
          return { tipo: "cat_eq", sql: `categoria = '${cat}'`, txt: `della categoria '${cat}'` };
        },
        () => {
          const s = pesca([10, 20, 50, 100]);
          return { tipo: "prezzo_gt", sql: `prezzo > ${s}`, txt: `con prezzo maggiore di ${s} euro` };
        },
        () => {
          const s = pesca([20, 50, 100]);
          return { tipo: "prezzo_lt", sql: `prezzo < ${s}`, txt: `con prezzo minore di ${s} euro` };
        },
        () => ({ tipo: "scorte_zero", sql: `scorte = 0`, txt: `esauriti (scorte a zero)` }),
      ])();
      return {
        tipo: `l1_where_${c.tipo}`,
        domanda: `Mostra nome e prezzo dei prodotti ${c.txt}.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE ${c.sql}`,
      };
    },
  },
  {
    livello: 1,
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
        tipo: `l1_order_${campo.c}`,
        domanda: `Elenca i prodotti ordinati per ${campo.t} in ordine ${verso.t}.`,
        soluzione: `SELECT nome, ${campo.c} FROM prodotti ORDER BY ${campo.c} ${verso.s}`,
      };
    },
  },

  {
    livello: 1,
    tabelle: ["clienti"],
    operatori: ["WHERE"],
    crea: () => {
      const c = pesca(["Milano", "Roma", "Torino", "Napoli", "Bologna"]);
      return {
        tipo: "l1_clienti_citta",
        domanda: `Mostra i clienti della citta di ${c}.`,
        soluzione: `SELECT nome, citta FROM clienti WHERE citta = '${c}'`,
      };
    },
  },
  {
    livello: 1,
    tabelle: ["studenti"],
    operatori: ["WHERE"],
    crea: () => {
      const a = pesca([1, 2, 3]);
      return {
        tipo: "l1_studenti_anno",
        domanda: `Mostra gli studenti del ${a}° anno.`,
        soluzione: `SELECT nome, anno FROM studenti WHERE anno = ${a}`,
      };
    },
  },
  {
    livello: 1,
    tabelle: ["studenti"],
    operatori: ["ORDER BY"],
    crea: () => {
      const verso = pesca([
        { s: "ASC", t: "crescente" },
        { s: "DESC", t: "decrescente" },
      ]);
      return {
        tipo: "l1_studenti_order",
        domanda: `Elenca gli studenti ordinati per anno in ordine ${verso.t}.`,
        soluzione: `SELECT nome, anno FROM studenti ORDER BY anno ${verso.s}`,
      };
    },
  },

  {
    livello: 1,
    tabelle: ["corsi"],
    operatori: [],
    crea: () => ({
      tipo: "l1_corsi",
      domanda: "Mostra titolo e crediti di tutti i corsi.",
      soluzione: "SELECT titolo, crediti FROM corsi",
    }),
  },
  {
    livello: 1,
    tabelle: ["corsi"],
    operatori: ["WHERE"],
    crea: () => {
      const n = pesca([6, 9, 12]);
      return {
        tipo: "l1_corsi_crediti",
        domanda: `Mostra i corsi da ${n} crediti.`,
        soluzione: `SELECT titolo, crediti FROM corsi WHERE crediti = ${n}`,
      };
    },
  },
  {
    livello: 1,
    tabelle: ["ordini"],
    operatori: ["WHERE"],
    crea: () => {
      const g = pesca(["02-01", "03-01", "04-01"]);
      return {
        tipo: "l1_ordini_data",
        domanda: `Mostra gli ordini effettuati dopo il ${g.slice(3)}/${g.slice(0, 2)}/2024.`,
        soluzione: `SELECT id, data, totale FROM ordini WHERE data > '2024-${g}'`,
      };
    },
  },
  {
    livello: 1,
    tabelle: ["ordini"],
    operatori: ["ORDER BY"],
    crea: () => ({
      tipo: "l1_ordini_order_data",
      domanda: "Elenca gli ordini dal piu recente al piu vecchio.",
      soluzione: "SELECT id, data, totale FROM ordini ORDER BY data DESC",
    }),
  },

  // ===== Livello 2: una tabella, condizioni piu ricche =====
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["WHERE"],
    crea: () => {
      // due condizioni con AND/OR
      const cat = pesca(["Informatica", "Alimentari", "Cancelleria"]);
      const s = pesca([20, 50, 100]);
      const v = pesca([
        {
          tipo: "and",
          sql: `categoria = '${cat}' AND prezzo > ${s}`,
          txt: `di categoria '${cat}' con prezzo maggiore di ${s} euro`,
        },
        {
          tipo: "or",
          sql: `prezzo < ${s} OR scorte = 0`,
          txt: `con prezzo sotto i ${s} euro oppure esauriti`,
        },
      ]);
      return {
        tipo: `l2_where_${v.tipo}`,
        domanda: `Mostra i prodotti ${v.txt}.`,
        soluzione: `SELECT nome, categoria, prezzo FROM prodotti WHERE ${v.sql}`,
      };
    },
  },
  {
    livello: 2,
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
        tipo: `l2_like_${modo.tipo}`,
        domanda: `Trova i prodotti il cui nome ${modo.txt}.`,
        soluzione: `SELECT nome FROM prodotti WHERE nome LIKE ${modo.sql}`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["WHERE", "BETWEEN"],
    crea: () => {
      const campo = pesca([
        { c: "prezzo", t: "prezzo", min: [1, 2, 5], max: [50, 100, 150] },
        { c: "scorte", t: "scorte", min: [10, 20], max: [100, 200] },
      ]);
      const min = pesca(campo.min);
      const max = pesca(campo.max);
      return {
        tipo: `l2_between_${campo.c}`,
        domanda: `Mostra i prodotti con ${campo.t} compreso tra ${min} e ${max}.`,
        soluzione: `SELECT nome, ${campo.c} FROM prodotti WHERE ${campo.c} BETWEEN ${min} AND ${max}`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["DISTINCT"],
    crea: () => ({
      tipo: "l2_distinct",
      domanda: "Elenca le categorie distinte presenti tra i prodotti.",
      soluzione: "SELECT DISTINCT categoria FROM prodotti",
    }),
  },
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["AGGREGATI"],
    crea: () => {
      const agg = pesca([
        { tipo: "count", sql: "COUNT(*)", alias: "totale", txt: "Conta quanti prodotti ci sono" },
        { tipo: "avg", sql: "AVG(prezzo)", alias: "prezzo_medio", txt: "Calcola il prezzo medio dei prodotti" },
        { tipo: "max", sql: "MAX(prezzo)", alias: "prezzo_max", txt: "Trova il prezzo piu alto" },
        { tipo: "sum", sql: "SUM(scorte)", alias: "scorte_totali", txt: "Calcola il totale delle scorte" },
      ]);
      return {
        tipo: `l2_agg_${agg.tipo}`,
        domanda: `${agg.txt}.`,
        soluzione: `SELECT ${agg.sql} AS ${agg.alias} FROM prodotti`,
      };
    },
  },

  {
    livello: 2,
    tabelle: ["clienti"],
    operatori: ["DISTINCT"],
    crea: () => ({
      tipo: "l2_clienti_distinct",
      domanda: "Elenca le citta distinte in cui ci sono clienti.",
      soluzione: "SELECT DISTINCT citta FROM clienti",
    }),
  },
  {
    livello: 2,
    tabelle: ["ordini"],
    operatori: ["WHERE", "BETWEEN"],
    crea: () => {
      const min = pesca([50, 100]);
      const max = pesca([200, 250]);
      return {
        tipo: "l2_ordini_between",
        domanda: `Mostra gli ordini con totale compreso tra ${min} e ${max} euro.`,
        soluzione: `SELECT id, totale FROM ordini WHERE totale BETWEEN ${min} AND ${max}`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["studenti"],
    operatori: ["AGGREGATI"],
    crea: () => {
      const a = pesca([
        { tipo: "count", sql: "COUNT(*)", alias: "studenti", txt: "Conta quanti studenti ci sono" },
        { tipo: "avg", sql: "AVG(anno)", alias: "anno_medio", txt: "Calcola l'anno medio degli studenti" },
      ]);
      return {
        tipo: `l2_studenti_agg_${a.tipo}`,
        domanda: `${a.txt}.`,
        soluzione: `SELECT ${a.sql} AS ${a.alias} FROM studenti`,
      };
    },
  },

  {
    livello: 2,
    tabelle: ["clienti"],
    operatori: ["WHERE", "IN"],
    crea: () => {
      const citta = pesca([
        ["Milano", "Roma"],
        ["Torino", "Napoli", "Bologna"],
        ["Roma", "Bologna"],
      ]);
      const lista = citta.map((c) => `'${c}'`).join(", ");
      return {
        tipo: "l2_in_citta",
        domanda: `Mostra i clienti che vivono a ${citta.join(" o ")}.`,
        soluzione: `SELECT nome, citta FROM clienti WHERE citta IN (${lista})`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["WHERE", "IN"],
    crea: () => {
      const cat = pesca([
        ["Informatica", "Cancelleria"],
        ["Alimentari", "Informatica"],
      ]);
      const lista = cat.map((c) => `'${c}'`).join(", ");
      return {
        tipo: "l2_in_categoria",
        domanda: `Mostra i prodotti di categoria ${cat.join(" o ")}.`,
        soluzione: `SELECT nome, categoria FROM prodotti WHERE categoria IN (${lista})`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["clienti"],
    operatori: ["WHERE", "IS NULL"],
    crea: () => {
      const v = pesca([
        { tipo: "null", sql: "email IS NULL", txt: "senza email registrata" },
        { tipo: "notnull", sql: "email IS NOT NULL", txt: "con un'email registrata" },
      ]);
      return {
        tipo: `l2_isnull_${v.tipo}`,
        domanda: `Mostra i clienti ${v.txt}.`,
        soluzione: `SELECT nome, email FROM clienti WHERE ${v.sql}`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["ordini"],
    operatori: ["WHERE", "BETWEEN"],
    crea: () => {
      const periodo = pesca([
        { da: "2024-02-01", a: "2024-03-31", txt: "febbraio e marzo" },
        { da: "2024-01-01", a: "2024-02-29", txt: "gennaio e febbraio" },
        { da: "2024-04-01", a: "2024-06-30", txt: "aprile e giugno" },
      ]);
      return {
        tipo: "l2_ordini_data_between",
        domanda: `Mostra gli ordini effettuati tra ${periodo.txt} 2024.`,
        soluzione: `SELECT id, data, totale FROM ordini WHERE data BETWEEN '${periodo.da}' AND '${periodo.a}'`,
      };
    },
  },
  {
    livello: 2,
    tabelle: ["prodotti"],
    operatori: ["AGGREGATI", "DISTINCT"],
    crea: () => ({
      tipo: "l2_count_distinct",
      domanda: "Conta quante categorie diverse esistono tra i prodotti.",
      soluzione: "SELECT COUNT(DISTINCT categoria) AS categorie FROM prodotti",
    }),
  },
  {
    livello: 2,
    tabelle: ["corsi"],
    operatori: ["AGGREGATI"],
    crea: () => ({
      tipo: "l2_corsi_media_crediti",
      domanda: "Calcola la media dei crediti dei corsi.",
      soluzione: "SELECT AVG(crediti) AS media_crediti FROM corsi",
    }),
  },

  // ===== Livello 3: due tabelle in JOIN, aggregati con GROUP BY =====
  {
    livello: 3,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN"],
    crea: () => ({
      tipo: "l3_join",
      domanda: "Mostra il nome del cliente e il totale di ogni suo ordine.",
      soluzione: "SELECT clienti.nome, ordini.totale FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id",
    }),
  },
  {
    livello: 3,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "WHERE"],
    crea: () => {
      const c = pesca([
        () => {
          const citta = pesca(["Milano", "Roma", "Torino"]);
          return { tipo: "citta", sql: `clienti.citta = '${citta}'`, txt: `dei clienti di ${citta}` };
        },
        () => {
          const s = pesca([50, 100, 150]);
          return { tipo: "totale", sql: `ordini.totale > ${s}`, txt: `con totale superiore a ${s} euro` };
        },
      ])();
      return {
        tipo: `l3_joinwhere_${c.tipo}`,
        domanda: `Mostra nome del cliente e totale degli ordini ${c.txt}.`,
        soluzione: `SELECT clienti.nome, ordini.totale FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id WHERE ${c.sql}`,
      };
    },
  },
  {
    livello: 3,
    tabelle: ["prodotti"],
    operatori: ["GROUP BY", "AGGREGATI"],
    crea: () => {
      const agg = pesca([
        { tipo: "count", sql: "COUNT(*)", alias: "quanti", txt: "quanti prodotti contiene" },
        { tipo: "avg", sql: "AVG(prezzo)", alias: "prezzo_medio", txt: "il prezzo medio" },
      ]);
      return {
        tipo: `l3_group_${agg.tipo}`,
        domanda: `Per ogni categoria mostra ${agg.txt}.`,
        soluzione: `SELECT categoria, ${agg.sql} AS ${agg.alias} FROM prodotti GROUP BY categoria`,
      };
    },
  },
  {
    livello: 3,
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
      ]);
      return {
        tipo: `l3_joingroup_${grp.et}_${agg.tipo}`,
        domanda: `Per ogni ${grp.et}, calcola ${agg.txt}.`,
        soluzione: `SELECT ${grp.by} AS ${grp.et}, ${agg.fn} AS ${agg.alias} FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY ${grp.by}`,
      };
    },
  },

  {
    livello: 3,
    tabelle: ["clienti", "ordini"],
    operatori: ["LEFT JOIN"],
    crea: () => ({
      tipo: "l3_left_join",
      domanda: "Mostra tutti i clienti con il totale di ogni loro ordine, inclusi i clienti senza ordini.",
      soluzione: "SELECT clienti.nome, ordini.totale FROM clienti LEFT JOIN ordini ON clienti.id = ordini.cliente_id",
    }),
  },
  {
    livello: 3,
    tabelle: ["prodotti"],
    operatori: ["CASE"],
    crea: () => {
      const s = pesca([50, 100, 150]);
      return {
        tipo: "l3_case_fascia",
        domanda: `Per ogni prodotto mostra il nome e l'etichetta 'caro' se il prezzo supera ${s} euro, altrimenti 'economico'.`,
        soluzione: `SELECT nome, CASE WHEN prezzo > ${s} THEN 'caro' ELSE 'economico' END AS fascia FROM prodotti`,
      };
    },
  },
  {
    livello: 3,
    tabelle: ["prodotti"],
    operatori: ["ORDER BY", "LIMIT"],
    crea: () => {
      const n = pesca([3, 5]);
      const v = pesca([
        { tipo: "costosi", campo: "prezzo", verso: "DESC", txt: "piu costosi" },
        { tipo: "economici", campo: "prezzo", verso: "ASC", txt: "piu economici" },
      ]);
      return {
        tipo: `l3_limit_${v.tipo}`,
        domanda: `Mostra i ${n} prodotti ${v.txt}.`,
        soluzione: `SELECT nome, prezzo FROM prodotti ORDER BY ${v.campo} ${v.verso} LIMIT ${n}`,
      };
    },
  },
  {
    livello: 3,
    tabelle: ["corsi", "voti"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    crea: () => ({
      tipo: "l3_media_corso",
      domanda: "Per ogni corso mostra la media dei voti.",
      soluzione: "SELECT corsi.titolo, AVG(voti.voto) AS media FROM corsi JOIN voti ON corsi.id = voti.corso_id GROUP BY corsi.titolo",
    }),
  },
  {
    livello: 3,
    tabelle: ["clienti"],
    operatori: ["GROUP BY", "AGGREGATI"],
    crea: () => ({
      tipo: "l3_clienti_per_citta",
      domanda: "Per ogni citta conta quanti clienti ci sono.",
      soluzione: "SELECT citta, COUNT(*) AS quanti FROM clienti GROUP BY citta",
    }),
  },

  // ===== Livello 4: piu tabelle, GROUP BY + HAVING, ORDER BY su aggregati =====
  {
    livello: 4,
    tabelle: ["prodotti"],
    operatori: ["GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const n = pesca([2, 3, 4]);
      return {
        tipo: "l4_having_categoria",
        domanda: `Mostra le categorie che contengono piu di ${n} prodotti.`,
        soluzione: `SELECT categoria, COUNT(*) AS quanti FROM prodotti GROUP BY categoria HAVING COUNT(*) > ${n}`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const c = pesca([
        () => {
          const s = pesca([100, 200, 300]);
          return { tipo: "sum", sel: "SUM(ordini.totale) AS spesa", having: `SUM(ordini.totale) > ${s}`, txt: `hanno speso in totale piu di ${s} euro` };
        },
        () => {
          const n = pesca([2, 3]);
          return { tipo: "count", sel: "COUNT(ordini.id) AS num_ordini", having: `COUNT(ordini.id) > ${n}`, txt: `hanno fatto piu di ${n} ordini` };
        },
      ])();
      return {
        tipo: `l4_having_${c.tipo}`,
        domanda: `Mostra i clienti che ${c.txt}.`,
        soluzione: `SELECT clienti.nome, ${c.sel} FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome HAVING ${c.having}`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["studenti", "corsi", "voti"],
    operatori: ["JOIN", "WHERE"],
    crea: () => {
      return pesca<() => Variante>([
        () => {
          const corso = pesca(["Matematica", "Informatica", "Storia"]);
          return {
            tipo: "l4_join3_corso",
            domanda: `Mostra nome studente e voto per gli esami del corso il cui titolo e '${corso}' (collegati alla tabella corsi).`,
            soluzione: `SELECT studenti.nome, voti.voto FROM voti JOIN studenti ON voti.studente_id = studenti.id JOIN corsi ON voti.corso_id = corsi.id WHERE corsi.titolo = '${corso}'`,
            tabelle: ["studenti", "corsi", "voti"],
          };
        },
        () => {
          const anno = pesca([1, 2, 3]);
          return {
            tipo: "l4_join3_anno",
            domanda: `Mostra nome studente e voto degli studenti del ${anno}° anno.`,
            soluzione: `SELECT studenti.nome, voti.voto FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE studenti.anno = ${anno}`,
            tabelle: ["studenti", "voti"],
          };
        },
      ])();
    },
  },
  {
    livello: 4,
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const s = pesca([22, 24, 25, 26]);
      return {
        tipo: "l4_media_studente",
        domanda: `Mostra gli studenti con media voti maggiore o uguale a ${s}.`,
        soluzione: `SELECT studenti.nome, AVG(voti.voto) AS media FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome HAVING AVG(voti.voto) >= ${s}`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI", "ORDER BY"],
    crea: () => ({
      tipo: "l4_classifica",
      domanda: "Mostra i clienti ordinati dalla spesa totale piu alta alla piu bassa.",
      soluzione: "SELECT clienti.nome, SUM(ordini.totale) AS spesa FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome ORDER BY spesa DESC",
    }),
  },

  {
    livello: 4,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI", "ORDER BY", "LIMIT"],
    crea: () => {
      const n = pesca([3, 5]);
      return {
        tipo: "l4_top_clienti",
        domanda: `Mostra i ${n} clienti che hanno speso di piu in totale.`,
        soluzione: `SELECT clienti.nome, SUM(ordini.totale) AS spesa FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome ORDER BY spesa DESC LIMIT ${n}`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["ordini"],
    operatori: ["GROUP BY", "AGGREGATI"],
    crea: () => ({
      tipo: "l4_ordini_per_mese",
      domanda: "Per ogni mese mostra il totale degli ordini.",
      soluzione: "SELECT substr(data, 1, 7) AS mese, SUM(totale) AS totale FROM ordini GROUP BY mese",
    }),
  },
  {
    livello: 4,
    tabelle: ["prodotti"],
    operatori: ["CASE", "GROUP BY", "AGGREGATI"],
    crea: () => {
      const s = pesca([50, 100]);
      return {
        tipo: "l4_case_count",
        domanda: `Conta quanti prodotti sono 'cari' (prezzo oltre ${s} euro) e quanti 'economici'.`,
        soluzione: `SELECT CASE WHEN prezzo > ${s} THEN 'caro' ELSE 'economico' END AS fascia, COUNT(*) AS quanti FROM prodotti GROUP BY fascia`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["clienti", "ordini"],
    operatori: ["LEFT JOIN", "GROUP BY", "AGGREGATI"],
    crea: () => ({
      tipo: "l4_left_join_count",
      domanda: "Per ogni cliente conta quanti ordini ha fatto (anche se nessuno).",
      soluzione: "SELECT clienti.nome, COUNT(ordini.id) AS num_ordini FROM clienti LEFT JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome",
    }),
  },
  {
    livello: 4,
    tabelle: ["corsi", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    crea: () => {
      const s = pesca([24, 25, 26]);
      return {
        tipo: "l4_having_corso",
        domanda: `Mostra i corsi con media voti superiore a ${s}.`,
        soluzione: `SELECT corsi.titolo, AVG(voti.voto) AS media FROM corsi JOIN voti ON corsi.id = voti.corso_id GROUP BY corsi.titolo HAVING AVG(voti.voto) > ${s}`,
      };
    },
  },
  {
    livello: 4,
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    crea: () => ({
      tipo: "l4_esami_studente",
      domanda: "Per ogni studente mostra quanti esami ha sostenuto.",
      soluzione: "SELECT studenti.nome, COUNT(voti.id) AS esami FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome",
    }),
  },

  // ===== Livello 5: subquery e query complesse =====
  {
    livello: 5,
    tabelle: ["prodotti"],
    operatori: ["WHERE", "SUBQUERY", "AGGREGATI"],
    crea: () => {
      const sub = pesca([
        { tipo: "media", fn: "AVG(prezzo)", op: ">", txt: "superiore al prezzo medio" },
        { tipo: "max", fn: "MAX(prezzo)", op: ">=", txt: "pari al prezzo massimo" },
      ]);
      return {
        tipo: `l5_sub_prodotti_${sub.tipo}`,
        domanda: `Trova i prodotti con prezzo ${sub.txt}.`,
        soluzione: `SELECT nome, prezzo FROM prodotti WHERE prezzo ${sub.op} (SELECT ${sub.fn} FROM prodotti)`,
      };
    },
  },
  {
    livello: 5,
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "SUBQUERY", "AGGREGATI"],
    crea: () => {
      const sub = pesca([
        { tipo: "media", fn: "AVG(voto)", op: ">", txt: "superiore alla media generale dei voti" },
        { tipo: "max", fn: "MAX(voto)", op: ">=", txt: "pari al voto massimo registrato" },
      ]);
      return {
        tipo: `l5_sub_voti_${sub.tipo}`,
        domanda: `Trova gli studenti che hanno preso almeno un voto ${sub.txt}.`,
        soluzione: `SELECT DISTINCT studenti.nome FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE voti.voto ${sub.op} (SELECT ${sub.fn} FROM voti)`,
      };
    },
  },
  {
    livello: 5,
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "SUBQUERY", "AGGREGATI"],
    crea: () => ({
      tipo: "l5_sub_spesa",
      domanda: "Trova i clienti che hanno fatto almeno un ordine sopra la media dei totali.",
      soluzione: "SELECT DISTINCT clienti.nome FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id WHERE ordini.totale > (SELECT AVG(totale) FROM ordini)",
    }),
  },
  {
    livello: 5,
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI", "SUBQUERY"],
    crea: () => ({
      tipo: "l5_media_sopra_media",
      domanda: "Trova gli studenti la cui media voti supera la media generale di tutti i voti.",
      soluzione: "SELECT studenti.nome, AVG(voti.voto) AS media FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome HAVING AVG(voti.voto) > (SELECT AVG(voto) FROM voti)",
    }),
  },
  {
    livello: 5,
    tabelle: ["clienti", "ordini"],
    operatori: ["WHERE", "IN", "SUBQUERY"],
    crea: () => {
      const v = pesca([
        { tipo: "con", op: "IN", txt: "hanno fatto almeno un ordine" },
        { tipo: "senza", op: "NOT IN", txt: "non hanno mai fatto un ordine" },
      ]);
      return {
        tipo: `l5_in_ordini_${v.tipo}`,
        domanda: `Mostra i clienti che ${v.txt}.`,
        soluzione: `SELECT nome FROM clienti WHERE id ${v.op} (SELECT cliente_id FROM ordini)`,
      };
    },
  },
  {
    livello: 5,
    tabelle: ["corsi", "voti"],
    operatori: ["WHERE", "IN", "SUBQUERY"],
    crea: () => {
      const voto = pesca([28, 30]);
      return {
        tipo: "l5_in_corsi_voto",
        domanda: `Mostra i corsi in cui qualcuno ha preso almeno un ${voto}.`,
        soluzione: `SELECT titolo FROM corsi WHERE id IN (SELECT corso_id FROM voti WHERE voto = ${voto})`,
      };
    },
  },
  {
    livello: 5,
    tabelle: ["prodotti"],
    operatori: ["WHERE", "SUBQUERY", "AGGREGATI"],
    crea: () => ({
      tipo: "l5_max_categoria",
      domanda: "Per ogni categoria trova il prodotto piu costoso (nome, categoria e prezzo).",
      soluzione: "SELECT nome, categoria, prezzo FROM prodotti p WHERE prezzo = (SELECT MAX(prezzo) FROM prodotti WHERE categoria = p.categoria)",
    }),
  },
  {
    livello: 5,
    tabelle: ["studenti", "voti"],
    operatori: ["WHERE", "IN", "SUBQUERY", "AGGREGATI"],
    crea: () => ({
      tipo: "l5_studenti_sopra_media",
      domanda: "Mostra gli studenti che hanno preso almeno un voto sopra la media generale.",
      soluzione: "SELECT nome FROM studenti WHERE id IN (SELECT studente_id FROM voti WHERE voto > (SELECT AVG(voto) FROM voti))",
    }),
  },
];

// Generatori che rispettano i filtri scelti: livello selezionato e operatori
// tutti dentro la whitelist spuntata.
export function generatoriCompatibili(
  livelli: number[],
  operatori: Operatore[]
): Generatore[] {
  return GENERATORI.filter(
    (g) =>
      livelli.includes(g.livello) &&
      g.operatori.every((op) => operatori.includes(op))
  );
}

// Crea un esercizio pescando a caso tra i generatori passati.
export function nuovoEsercizio(generatori: Generatore[], id: number): Esercizio {
  const g = pesca(generatori);
  const v = g.crea();
  const tabelle = v.tabelle ?? g.tabelle;
  return {
    id,
    tipo: v.tipo,
    tema: temaDa(tabelle),
    livello: g.livello,
    tabelle,
    operatori: g.operatori,
    domanda: v.domanda,
    soluzione: v.soluzione,
  };
}

// Pesca un esercizio evitando i temi usati di recente e lo stesso schema di
// fila. Se i filtri lasciano un solo tema, ripiega senza il vincolo.
export function pescaEsercizio(
  generatori: Generatore[],
  id: number,
  temiRecenti: string[],
  tipoPrecedente: string | undefined
): Esercizio {
  let pool = generatori.filter((g) => !temiRecenti.includes(temaDa(g.tabelle)));
  if (pool.length === 0 && temiRecenti.length > 0) {
    const ultimo = temiRecenti[temiRecenti.length - 1];
    pool = generatori.filter((g) => temaDa(g.tabelle) !== ultimo);
  }
  if (pool.length === 0) pool = generatori;

  let e = nuovoEsercizio(pool, id);
  for (let i = 0; i < 12 && e.tipo === tipoPrecedente; i++) {
    e = nuovoEsercizio(pool, id);
  }
  return e;
}
