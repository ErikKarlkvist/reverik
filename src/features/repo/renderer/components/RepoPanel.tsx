import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { useRepo } from '../RepoContext';
import { RepoCard } from './RepoCard';
import { RecentList } from './RecentList';
import './repo.css';

export function RepoPanel(): JSX.Element {
  const { repo, busy, error, pickLocal, openDemo, clearError } = useRepo();

  return (
    <section className="repo">
      <h2 className="repo__heading">{t('repo.heading')}</h2>

      {repo ? <RepoCard repo={repo} /> : <p className="repo__muted">{t('repo.none')}</p>}

      <div className="repo__actions">
        <button type="button" disabled={busy} onClick={() => void pickLocal()}>
          {t('repo.pickFolder')}
        </button>
        {!repo && (
          <button type="button" disabled={busy} onClick={() => void openDemo()}>
            {t('repo.loadDemo')}
          </button>
        )}
      </div>

      {busy && <p className="repo__muted">{t('repo.reading')}</p>}

      {error && (
        <p className="repo__error" onClick={clearError}>
          {error}
        </p>
      )}

      <RecentList />
    </section>
  );
}
