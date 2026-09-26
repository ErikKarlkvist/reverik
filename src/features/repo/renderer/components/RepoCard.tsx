import { type JSX, useState } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { type RepoInfo } from '../../model/repo';

interface Props {
  repo: RepoInfo;
  busy: boolean;
  onReload: () => void;
}

/** Repots namn med hämta-knapp. Branch, filer, språk och origin ligger bakom en chevron. */
export function RepoCard({ repo, busy, onReload }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="repo-card">
      <div className="repo-card__head">
        <button
          type="button"
          className="repo-card__toggle"
          aria-expanded={open}
          title={repo.path}
          onClick={() => {
            setOpen((o) => !o);
          }}
        >
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size="sm" />
          <span className="repo-card__name">{repo.name}</span>
        </button>
        <button
          type="button"
          className={`icon-button icon-button--quiet repo-card__reload${busy ? ' is-busy' : ''}`}
          title={t('repo.reload')}
          aria-label={t('repo.reload')}
          disabled={busy || !repo.isGit}
          onClick={onReload}
        >
          <Icon name="restart" size="sm" />
        </button>
      </div>
      {open && (
        <div className="repo-card__meta-block">
          <div className="repo-card__meta">
            {repo.isGit ? (repo.branch ?? t('repo.detachedHead')) : t('repo.noGit')} ·{' '}
            {t('repo.files', { count: repo.fileCount })}
          </div>
          {repo.languages.length > 0 && (
            <ul className="repo-card__langs">
              {repo.languages.map((lang) => (
                <li key={lang.name}>
                  {lang.name} <span className="repo__muted">{lang.files}</span>
                </li>
              ))}
            </ul>
          )}
          {repo.origin && (
            <div className="repo-card__origin" title={repo.origin}>
              {repo.origin}
            </div>
          )}
          <div className="repo-card__origin" title={repo.path}>
            {repo.path}
          </div>
        </div>
      )}
    </div>
  );
}
