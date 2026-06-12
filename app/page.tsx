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
  const [esercizio, setEsercizio] = useState<Esercizio | null>(null);
  const [query, setQuery] = useState("");
  const [risultato, setRisultato] = useState<QueryResult | null>(null);
  const [atteso, setAtteso] = useState<QueryResult | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [esito, setEsito] = useState<"ok" | "ko" | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    getDb().then(setDb);
  }, []);

  // Carica un nuovo esercizio a caso tra quelli compatibili con i filtri.
  function caricaNuovo(database: Database) {
    const gen = generatoriCompatibili(diffAttive, opAttivi);
    setQuery("");
    setRisultato(null);
    setTempo(null);
    setEsito(null);
    setErrore(null);
    if (gen.length === 0) {
      setEsercizio(null);
      setAtteso(null);
      return;
    }
    idRef.current += 1;
    // Evito di riproporre lo stesso schema di esercizio (non solo lo stesso
    // testo): cosi non capita due volte di fila la stessa query con un numero diverso.
    const precedente = esercizio?.tipo;
    let e = nuovoEsercizio(gen, idRef.current);
    for (let i = 0; i < 12 && e.tipo === precedente; i++) {
      e = nuovoEsercizio(gen, idRef.current);
    }
    setEsercizio(e);
    setAtteso(runQuery(database, e.soluzione));
  }

  // Rigenero l'esercizio quando il db è pronto o cambiano i filtri.
  useEffect(() => {
    if (db) caricaNuovo(db);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, opAttivi, diffAttive]);

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

      {db && !esercizio && (
        <p className="sub">Nessun esercizio con questi filtri. Seleziona almeno una difficolta e gli operatori necessari.</p>
      )}

      {db && esercizio && (
        <section>
          <div className="testata-esercizio">
            <h2>
              <span className="badge">{esercizio.difficolta}</span> {esercizio.domanda}
            </h2>
            <button className="secondario" onClick={() => caricaNuovo(db)}>
              Salta →
            </button>
          </div>

          <div className="lavoro">
            <div className="riferimento">
              <div className="caption">Tabelle di esempio</div>
              {esercizio.tabelle.map((nome) => {
                const t = TABLE_MAP[nome];
                return (
                  <div key={nome} className="tabella">
                    <div className="sub">{nome}</div>
                    <TableView data={{ columns: t.columns.map((c) => c.name), rows: t.rows }} />
                  </div>
                );
              })}

              {atteso && (
                <>
                  <div className="caption">Risultato atteso</div>
                  <div className="tabella">
                    <TableView data={atteso} />
                  </div>
                </>
              )}
            </div>

            <div className="area-query">
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
                  <div className="tabella">
                    <TableView data={risultato} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
