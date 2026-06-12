import { QueryResult } from "@/lib/db";

// Renderizza un set di risultati (o una tabella di esempio) come tabella HTML.
export default function TableView({ data }: { data: QueryResult }) {
  if (data.columns.length === 0) {
    return <p className="sub">Nessun dato.</p>;
  }

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
        {data.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell === null ? "NULL" : String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
