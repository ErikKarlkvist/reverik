import { type JSX } from 'react';
import { useRepo } from '../RepoContext';
import { RepoCard } from './RepoCard';
import { RecentList } from './RecentList';
import './repo.css';

export function RepoPanel(): JSX.Element {
  const { repo, busy, error, pickLocal, openDemo, clearError } = useRepo();

  return (
    <section className="repo">
      <h2 className="repo__heading">Repo</h2>

      {repo ? <RepoCard repo={repo} /> : <p className="repo__muted">Inget repo valt.</p>}

      <div className="repo__actions">
        <button type="button" disabled={busy} onClick={() => void pickLocal()}>
          Välj mapp…
        </button>
        {!repo && (
          <button type="button" disabled={busy} onClick={() => void openDemo()}>
            Ladda demo
          </button>
        )}
      </div>

      {busy && <p className="repo__muted">Läser repo…</p>}

      {error && (
        <p className="repo__error" onClick={clearError}>
          {error}
        </p>
      )}

      <RecentList />
    </section>
  );
}
