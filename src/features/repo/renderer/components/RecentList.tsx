import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useRepo } from '../RepoContext';

export function RecentList(): JSX.Element | null {
  const { repo, recent, busy, open, forget } = useRepo();
  const others = recent.filter((r) => r.path !== repo?.path);
  if (others.length === 0) return null;

  return (
    <div className="recent">
      <h3 className="repo__subheading">{t('repo.recent')}</h3>
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
              className="icon-button icon-button--quiet"
              title={t('repo.forget')}
              aria-label={t('repo.forget')}
              onClick={() => void forget(r.path)}
            >
              <Icon name="close" size="sm" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
