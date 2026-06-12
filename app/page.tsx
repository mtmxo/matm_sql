"use client";

import { useEffect, useRef, useState } from "react";
import type { Database } from "sql.js";
import { creaDatabase, runQuery, QueryResult } from "@/lib/db";
import { generaDataset, buildSchemaSql, Table } from "@/lib/data";
import {
  OPERATORI,
  Operatore,
  Esercizio,
  LIVELLI,
  generatoriCompatibili,
  nuovoEsercizio,
} from "@/lib/exercises";
import TableView from "./TableView";

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

function nomeLivello(n: number): string {
  return LIVELLI.find((l) => l.n === n)?.nome ?? "";
}

export default function Home() {
  const [livelliAttivi, setLivelliAttivi] = useState<number[]>(LIVELLI.map((l) => l.n));
  const [opAttivi, setOpAttivi] = useState<Operatore[]>([...OPERATORI]);
  const [esercizio, setEsercizio] = useState<Esercizio | null>(null);
  const [dataset, setDataset] = useState<Table[]>([]);
  const [db, setDb] = useState<Database | null>(null);
  const [query, setQuery] = useState("");
  const [risultato, setRisultato] = useState<QueryResult | null>(null);
  const [atteso, setAtteso] = useState<QueryResult | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [esito, setEsito] = useState<"ok" | "ko" | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(true);
  const idRef = useRef(0);

  // Genera un nuovo esercizio (con i suoi dati) tra quelli compatibili coi filtri.
  async function caricaNuovo() {
    setQuery("");
    setRisultato(null);
    setTempo(null);
    setEsito(null);
    setErrore(null);

    const gen = generatoriCompatibili(livelliAttivi, opAttivi);
    if (gen.length === 0) {
      setEsercizio(null);
      setDataset([]);
      setCaricando(false);
      return;
    }

    setCaricando(true);
    // pesco un esercizio evitando di ripetere lo stesso schema di fila
    idRef.current += 1;
    const precedente = esercizio?.tipo;
    let e = nuovoEsercizio(gen, idRef.current);
    for (let i = 0; i < 12 && e.tipo === precedente; i++) {
      e = nuovoEsercizio(gen, idRef.current);
    }

    // i dati scalano col livello dell'esercizio
    const tabelle = generaDataset(e.livello);
    const nuovoDb = await creaDatabase(buildSchemaSql(tabelle));

    setDataset(tabelle);
    setDb(nuovoDb);
    setEsercizio(e);
    setAtteso(runQuery(nuovoDb, e.soluzione));
    setCaricando(false);
  }

  // Ricarico quando cambiano i filtri (e al primo avvio).
  useEffect(() => {
    caricaNuovo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livelliAttivi, opAttivi]);

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

  function toggleLivello(n: number) {
    setLivelliAttivi((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  return (
    <div className="container">
      <header>
        <h1>matm_sql</h1>
        <p className="sub">Allenati con le query SQL. Scrivi, esegui, confronta.</p>

        <div className="filtri">
          <div>
            <div className="caption">Livello</div>
            <div className="gruppo-filtri">
              {LIVELLI.map((l) => (
                <label key={l.n} className="chk">
                  <input
                    type="checkbox"
                    checked={livelliAttivi.includes(l.n)}
                    onChange={() => toggleLivello(l.n)}
                  />
                  {l.n}. {l.nome}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="caption">Operatori che vuoi praticare</div>
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
            <p className="sub nota">Vedi solo esercizi che usano gli operatori spuntati: togli quelli che non hai ancora studiato.</p>
          </div>
        </div>
      </header>

      {caricando && <p>Caricamento…</p>}

      {!caricando && !esercizio && (
        <p className="sub">Nessun esercizio con questi filtri. Seleziona almeno un livello e gli operatori necessari.</p>
      )}

      {!caricando && esercizio && (
        <section>
          <div className="testata-esercizio">
            <h2>
              <span className="badge">Liv. {esercizio.livello} · {nomeLivello(esercizio.livello)}</span> {esercizio.domanda}
            </h2>
            <button className="secondario" onClick={caricaNuovo}>
              Salta →
            </button>
          </div>

          <div className="lavoro">
            <div className="riferimento">
              <div className="caption">Tabelle di esempio</div>
              {esercizio.tabelle.map((nome) => {
                const t = dataset.find((x) => x.name === nome);
                if (!t) return null;
                return (
                  <div key={nome} className="tabella">
                    <div className="sub">{nome} · {t.rows.length} righe</div>
                    <TableView data={{ columns: t.columns.map((c) => c.name), rows: t.rows }} />
                  </div>
                );
              })}

              {atteso && (
                <>
                  <div className="caption">Risultato atteso</div>
                  <div className="tabella">
                    <TableView data={atteso} maxRighe={12} />
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
                    <TableView data={risultato} maxRighe={12} />
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
