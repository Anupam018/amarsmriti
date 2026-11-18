import { MN, ym } from '../utils.js';

export default function Grid({ members, pay }) {
  if (!members.length) return <div className="mu">এখনো কিছু নেই</div>;
  const now = new Date();
  const ms = [];
  for (let i = 11; i >= 0; i--) ms.push(ym(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return (
    <table>
      <thead>
        <tr>
          <th>নাম</th>
          {ms.map((k) => <th key={k}>{MN[+k.slice(5) - 1].slice(0, 3)}</th>)}
        </tr>
      </thead>
      <tbody>
        {members.map((x) => (
          <tr key={x.id}>
            <td>{x.name}</td>
            {ms.map((k) =>
              k < x.start ? <td key={k} className="mu">–</td>
              : pay[k]?.[x.id] ? <td key={k} className="y">✓</td>
              : <td key={k} className="n">✗</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
