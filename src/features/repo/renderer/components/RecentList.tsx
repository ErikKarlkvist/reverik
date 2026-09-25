import { type JSX } from 'react';
import { useRepo } from '../RepoContext';

export function RecentList(): JSX.Element | null {
  const { repo, recent, busy, open, forget } = useRepo();
  const others = recent.filter((r) => r.path !== repo?.path);
  if (others.length === 0) return null;

  return (
    <div className="recent">
      <h3 className="repo__subheading">Senaste</h3>
      <ul className="recent__list">
        {others.map((r) => (
          <li key={r.path} className="recent__item">
            <button
              type="button"
              className="recent__open"
              disabled={busy}
              title={r.path}
              onClick={() => void open(r.path)}
            >
              {r.name}
            </button>
            <button
              type="button"
              className="recent__forget"
              title="Ta bort från listan"
              onClick={() => void forget(r.path)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
