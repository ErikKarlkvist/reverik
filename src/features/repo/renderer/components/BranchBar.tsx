import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { useRepo } from '../RepoContext';
import './repo.css';

interface Props {
  /** Skickar en reviewprompt till agenten för aktuell branch mot basbranchen */
  onRunReview?: ((base: string, head: string) => void) | undefined;
}

/**
 * Raden ovanför grafen: branchen man står på och den man jämför mot.
 * Byte av den första är en riktig checkout, byte av den andra sparas per repo.
 */
export function BranchBar({ onRunReview }: Props): JSX.Element | null {
  const { repo, busy, branches, baseBranch, setBaseBranch, checkout } = useRepo();
  if (!repo?.isGit) return null;
  const current = repo.branch;
  const others = branches.filter((b) => b !== current);

  return (
    <div className="branch-bar">
      <Icon name="branch" size="sm" />
      <label className="branch-bar__field">
        {t('branch.on')}
        <select
          className="branch-bar__select"
          value={current ?? ''}
          disabled={busy || branches.length === 0}
          title={t('branch.checkoutHint')}
          onChange={(event) => {
            void checkout(event.target.value);
          }}
        >
          {current === null && <option value="">{t('repo.detachedHead')}</option>}
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label className="branch-bar__field">
        {t('branch.compare')}
        <select
          className="branch-bar__select"
          value={baseBranch ?? ''}
          disabled={others.length === 0}
          title={t('branch.compareHint')}
          onChange={(event) => {
            setBaseBranch(event.target.value);
          }}
        >
          {others.length === 0 && <option value="">{t('branch.none')}</option>}
          {others.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      {onRunReview && (
        <button
          type="button"
          className="branch-bar__run"
          disabled={busy || current === null || baseBranch === null}
          title={t('branch.runReviewHint')}
          onClick={() => {
            if (current !== null && baseBranch !== null) onRunReview(baseBranch, current);
          }}
        >
          <Icon name="warning" size="sm" /> {t('branch.runReview')}
        </button>
      )}
    </div>
  );
}
