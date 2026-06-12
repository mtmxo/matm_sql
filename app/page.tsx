"use client";

import { useEffect, useRef, useState } from "react";
import type { Database } from "sql.js";
import { getDb, runQuery, QueryResult } from "@/lib/db";
import { TABLE_MAP } from "@/lib/data";
import {
  OPERATORI,
  Operatore,
  Esercizio,
  Difficolta,
  generatoriCompatibili,
  nuovoEsercizio,
} from "@/lib/exercises";
import TableView from "./TableView";

const DIFFICOLTA: Difficolta[] = ["facile", "medio", "difficile"];

// Confronto "morbido": stesse righe a prescindere dall'ordine.
function risultatiUguali(a: QueryResult, b: QueryResult): boolean {
  if (a.columns.length !== b.columns.length) return false;
  if (a.rows.length !== b.rows.length) return false;
  const norm = (r: QueryResult) =>
    r.rows.map((row) => JSON.stringify(row)).sort();
  const ra = norm(a);
  const rb = norm(b);
  return ra.every((v, i) => v === rb[i]);
}

export default function Home() {
  const [db, setDb] = useState<Database | null>(null);
  const [opAttivi, setOpAttivi] = useState<Operatore[]>([...OPERATORI]);
  const [diffAttive, setDiffAttive] = useState<Difficolta[]>([...DIFFICOLTA]);
  const [esercizi, setEsercizi] = useState<Esercizio[]>([]);
  const [esercizioId, setEsercizioId] = useState<number | null>(null);
  const idRef = useRef(0);
  const [query, setQuery] = useState("");
  const [risultato, setRisultato] = useState<QueryResult | null>(null);
  const [atteso, setAtteso] = useState<QueryResult | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [esito, setEsito] = useState<"ok" | "ko" | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    getDb().then(setDb);
  }, []);

  // A ogni cambio di filtri rigenero una lista fresca di esercizi.
  useEffect(() => {
    const gen = generatoriCompatibili(diffAttive, opAttivi);
    if (gen.length === 0) {
      setEsercizi([]);
      setEsercizioId(null);
      return;
    }
    const lista: Esercizio[] = [];
    for (let i = 0; i < 5; i++) {
      idRef.current += 1;
      lista.push(nuovoEsercizio(gen, idRef.current));
    }
    setEsercizi(lista);
    setEsercizioId(null);
  }, [opAttivi, diffAttive]);

  const esercizio = esercizi.find((e) => e.id === esercizioId) || null;

  // Aggiunge un nuovo esercizio in cima alla lista e lo apre.
  function generaUno() {
    const gen = generatoriCompatibili(diffAttive, opAttivi);
    if (gen.length === 0) return;
    idRef.current += 1;
    const e = nuovoEsercizio(gen, idRef.current);
    setEsercizi((prev) => [e, ...prev]);
    apriEsercizio(e);
  }

  // Quando cambio esercizio resetto l'area di lavoro e calcolo il risultato atteso.
  function apriEsercizio(e: Esercizio) {
    setEsercizioId(e.id);
    setQuery("");
    setRisultato(null);
    setTempo(null);
    setEsito(null);
    setErrore(null);
    if (db) {
      setAtteso(runQuery(db, e.soluzione));
    }
  }

  function esegui() {
    if (!db || !esercizio) return;
    setErrore(null);
    try {
      const start = performance.now();
      const res = runQuery(db, query);
      const ms = performance.now() - start;
      setRisultato(res);
      setTempo(ms);
      setEsito(atteso && risultatiUguali(res, atteso) ? "ok" : "ko");
    } catch (err) {
      setRisultato(null);
      setTempo(null);
      setEsito(null);
      setErrore(err instanceof Error ? err.message : String(err));
    }
  }

  function toggleOperatore(op: Operatore) {
    setOpAttivi((prev) =>
      prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]
    );
  }

  function toggleDifficolta(d: Difficolta) {
    setDiffAttive((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  return (
    <div className="container">
      <header>
        <h1>matm_sql</h1>
        <p className="sub">Allenati con le query SQL. Scrivi, esegui, confronta.</p>

        <div className="filtri">
          <div>
            <div className="caption">Difficolta</div>
            <div className="gruppo-filtri">
              {DIFFICOLTA.map((d) => (
                <label key={d} className="chk">
                  <input
                    type="checkbox"
                    checked={diffAttive.includes(d)}
                    onChange={() => toggleDifficolta(d)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="caption">Operatori ammessi</div>
            <div className="gruppo-filtri">
              {OPERATORI.map((op) => (
                <label key={op} className="chk">
                  <input
                    type="checkbox"
                    checked={opAttivi.includes(op)}
                    onChange={() => toggleOperatore(op)}
                  />
                  {op}
                </label>
              ))}
            </div>
          </div>
        </div>
      </header>

      {!db && <p>Caricamento database…</p>}

      {db && (
        <div className="main">
          <aside>
            <h2>Esercizi</h2>
            <button onClick={generaUno} disabled={esercizi.length === 0}>
              + Nuovo esercizio
            </button>
            <ul className="lista">
              {esercizi.map((e) => (
                <li
                  key={e.id}
                  className={e.id === esercizioId ? "attivo" : ""}
                  onClick={() => apriEsercizio(e)}
                >
                  <span className="badge">{e.difficolta}</span>
                  <div>{e.domanda}</div>
                </li>
              ))}
              {esercizi.length === 0 && (
                <li>Nessun esercizio con questi filtri.</li>
              )}
            </ul>
          </aside>

          <section>
            {!esercizio && <p className="sub">Scegli un esercizio dalla lista.</p>}

            {esercizio && (
              <>
                <h2>{esercizio.domanda}</h2>

                <div className="caption">Tabelle di esempio</div>
                {esercizio.tabelle.map((nome) => {
                  const t = TABLE_MAP[nome];
                  return (
                    <div key={nome}>
                      <div className="sub">{nome}</div>
                      <TableView data={{ columns: t.columns.map((c) => c.name), rows: t.rows }} />
                    </div>
                  );
                })}

                {atteso && (
                  <>
                    <div className="caption">Risultato atteso</div>
                    <TableView data={atteso} />
                  </>
                )}

                <div className="caption">La tua query</div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT ..."
                />

                <div className="barra-azioni">
                  <button onClick={esegui} disabled={!query.trim()}>
                    Esegui
                  </button>
                  {tempo !== null && (
                    <span className="tempo">Tempo: {tempo.toFixed(2)} ms</span>
                  )}
                  {esito === "ok" && <span className="esito-ok">Corretto ✓</span>}
                  {esito === "ko" && (
                    <span className="esito-ko">Risultato diverso da quello atteso ✗</span>
                  )}
                </div>

                {errore && <div className="errore">Errore: {errore}</div>}

                {risultato && (
                  <>
                    <div className="caption">Il tuo risultato</div>
                    <TableView data={risultato} />
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
