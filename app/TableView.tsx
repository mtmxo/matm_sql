import { QueryResult } from "@/lib/db";

// Renderizza un set di risultati (o una tabella di esempio). Se le righe sono
// tante ne mostra solo le prime e indica quante restano.
export default function TableView({ data, maxRighe = 8 }: { data: QueryResult; maxRighe?: number }) {
  if (data.columns.length === 0) {
    return <p className="sub">Nessun dato.</p>;
  }

  const righe = data.rows.slice(0, maxRighe);
  const restanti = data.rows.length - righe.length;

  return (
    <table>
      <thead>
        <tr>
          {data.columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {righe.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell === null ? "NULL" : String(cell)}</td>
            ))}
          </tr>
        ))}
        {restanti > 0 && (
          <tr>
            <td colSpan={data.columns.length} className="sub">
              … e altre {restanti} righe
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
