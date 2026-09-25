import { type JSX, type SubmitEvent, useState } from 'react';
import { looksLikeGitUrl } from '../../model/clone-url';
import { useRepo } from '../RepoContext';
import { RepoCard } from './RepoCard';
import { RecentList } from './RecentList';
import './repo.css';

export function RepoPanel(): JSX.Element {
  const { repo, busy, error, cloneProgress, pickLocal, clone, clearError } = useRepo();
  const [url, setUrl] = useState('');
  const urlOk = looksLikeGitUrl(url);

  const onClone = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!urlOk || busy) return;
    void clone(url).then(() => {
      setUrl('');
    });
  };

  return (
    <section className="repo">
      <h2 className="repo__heading">Repo</h2>

      {repo ? <RepoCard repo={repo} /> : <p className="repo__muted">Inget repo valt.</p>}

      <div className="repo__actions">
        <button type="button" disabled={busy} onClick={() => void pickLocal()}>
          Välj mapp…
        </button>
      </div>

      <form className="repo__clone" onSubmit={onClone}>
        <input
          type="text"
          placeholder="git-URL att klona"
          value={url}
          disabled={busy}
          onChange={(e) => {
            setUrl(e.target.value);
          }}
          spellCheck={false}
        />
        <button type="submit" disabled={busy || !urlOk}>
          Klona
        </button>
      </form>

      {cloneProgress && (
        <div className="repo__progress" role="progressbar" aria-valuenow={cloneProgress.percent}>
          <div className="repo__progress-bar" style={{ width: `${cloneProgress.percent}%` }} />
          <span className="repo__progress-label">
            {cloneProgress.stage} {cloneProgress.percent}%
          </span>
        </div>
      )}

      {busy && !cloneProgress && <p className="repo__muted">Läser repo…</p>}

      {error && (
        <p className="repo__error" onClick={clearError}>
          {error}
        </p>
      )}

      <RecentList />
    </section>
  );
}
