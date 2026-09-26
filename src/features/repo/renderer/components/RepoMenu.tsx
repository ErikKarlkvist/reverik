import { type JSX, useEffect, useRef, useState } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useRepo } from '../RepoContext';
import './repo.css';

/**
 * Mappväljaren i sidfoten: knappen visar valt repo, menyn ovanför listar
 * senaste repon, val av ny mapp och demot.
 */
export function RepoMenu(): JSX.Element {
  const { repo, recent, busy, open, forget, pickLocal, openDemo } = useRepo();
  const [isOpen, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);

  // Stäng vid klick utanför eller Escape
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const choose = (action: () => Promise<void>): void => {
    setOpen(false);
    void action();
  };

  return (
    <div className="repo-menu" ref={root}>
      <button
        type="button"
        className="text-button repo-menu__button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={repo?.path ?? t('repo.none')}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <Icon name="folder" size="sm" /> {repo?.name ?? t('repo.folder')}
      </button>
      {isOpen && (
        <div className="repo-menu__popover" role="menu">
          {recent.length > 0 && (
            <>
              <div className="repo-menu__heading">{t('repo.recent')}</div>
              <ul className="repo-menu__list">
                {recent.map((r) => {
                  const active = r.path === repo?.path;
                  return (
                    <li key={r.path} className={`repo-menu__item${active ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        role="menuitem"
                        className="repo-menu__open"
                        disabled={busy}
                        title={r.path}
                        onClick={() => {
                          choose(() => open(r.path));
                        }}
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
                  );
                })}
              </ul>
            </>
          )}
          <div className="repo-menu__actions">
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => {
                choose(pickLocal);
              }}
            >
              {t('repo.pickFolder')}
            </button>
            <button
              type="button"
              role="menuitem"
              className="text-button"
              disabled={busy}
              onClick={() => {
                choose(openDemo);
              }}
            >
              {t('repo.loadDemo')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
