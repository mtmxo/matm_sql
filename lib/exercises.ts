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

export const ESERCIZI: Esercizio[] = [
  {
    id: 1,
    difficolta: "facile",
    domanda: "Mostra nome e prezzo di tutti i prodotti della categoria 'Informatica'.",
    tabelle: ["prodotti"],
    operatori: ["WHERE"],
    soluzione: "SELECT nome, prezzo FROM prodotti WHERE categoria = 'Informatica'",
  },
  {
    id: 2,
    difficolta: "facile",
    domanda: "Elenca tutti i prodotti ordinati per prezzo decrescente.",
    tabelle: ["prodotti"],
    operatori: ["ORDER BY"],
    soluzione: "SELECT nome, prezzo FROM prodotti ORDER BY prezzo DESC",
  },
  {
    id: 3,
    difficolta: "facile",
    domanda: "Trova i prodotti il cui nome contiene la lettera 'a'.",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "LIKE"],
    soluzione: "SELECT nome FROM prodotti WHERE nome LIKE '%a%'",
  },
  {
    id: 4,
    difficolta: "facile",
    domanda: "Mostra i prodotti con prezzo compreso tra 2 e 30 euro.",
    tabelle: ["prodotti"],
    operatori: ["WHERE", "BETWEEN"],
    soluzione: "SELECT nome, prezzo FROM prodotti WHERE prezzo BETWEEN 2 AND 30",
  },
  {
    id: 5,
    difficolta: "facile",
    domanda: "Elenca le categorie distinte presenti tra i prodotti.",
    tabelle: ["prodotti"],
    operatori: ["DISTINCT"],
    soluzione: "SELECT DISTINCT categoria FROM prodotti",
  },
  {
    id: 6,
    difficolta: "medio",
    domanda: "Mostra il nome del cliente e il totale di ogni suo ordine.",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN"],
    soluzione:
      "SELECT clienti.nome, ordini.totale FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id",
  },
  {
    id: 7,
    difficolta: "medio",
    domanda: "Calcola quanti ordini ha fatto ogni cliente.",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    soluzione:
      "SELECT clienti.nome, COUNT(ordini.id) AS num_ordini FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome",
  },
  {
    id: 8,
    difficolta: "medio",
    domanda: "Calcola la spesa totale per ogni città.",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "AGGREGATI"],
    soluzione:
      "SELECT clienti.citta, SUM(ordini.totale) AS spesa FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.citta",
  },
  {
    id: 9,
    difficolta: "medio",
    domanda: "Mostra i clienti che hanno speso in totale piu di 100 euro.",
    tabelle: ["clienti", "ordini"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    soluzione:
      "SELECT clienti.nome, SUM(ordini.totale) AS spesa FROM clienti JOIN ordini ON clienti.id = ordini.cliente_id GROUP BY clienti.nome HAVING SUM(ordini.totale) > 100",
  },
  {
    id: 10,
    difficolta: "difficile",
    domanda: "Mostra nome dello studente, titolo del corso e voto per ogni esame sostenuto.",
    tabelle: ["studenti", "corsi", "voti"],
    operatori: ["JOIN"],
    soluzione:
      "SELECT studenti.nome, corsi.titolo, voti.voto FROM voti JOIN studenti ON voti.studente_id = studenti.id JOIN corsi ON voti.corso_id = corsi.id",
  },
  {
    id: 11,
    difficolta: "difficile",
    domanda: "Calcola la media dei voti di ogni studente e mostra solo chi ha media >= 25.",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "GROUP BY", "HAVING", "AGGREGATI"],
    soluzione:
      "SELECT studenti.nome, AVG(voti.voto) AS media FROM studenti JOIN voti ON studenti.id = voti.studente_id GROUP BY studenti.nome HAVING AVG(voti.voto) >= 25",
  },
  {
    id: 12,
    difficolta: "difficile",
    domanda: "Trova gli studenti che hanno preso un voto superiore alla media generale dei voti.",
    tabelle: ["studenti", "voti"],
    operatori: ["JOIN", "SUBQUERY", "AGGREGATI"],
    soluzione:
      "SELECT DISTINCT studenti.nome FROM studenti JOIN voti ON studenti.id = voti.studente_id WHERE voti.voto > (SELECT AVG(voto) FROM voti)",
  },
];
