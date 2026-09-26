import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { Icon } from '@/common/renderer/Icon';
import { SearchSelect } from '@/common/renderer/SearchSelect';
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
      <label className="branch-bar__field">
        <span>
          <Icon name="branch" size="sm" /> {t('branch.on')}
        </span>
        <SearchSelect
          options={branches}
          value={current}
          disabled={busy || branches.length === 0}
          label={t('branch.checkoutHint')}
          placeholder={current === null ? t('repo.detachedHead') : t('branch.search')}
          emptyText={t('branch.noMatch')}
          onSelect={(branch) => {
            void checkout(branch);
          }}
        />
      </label>
      <label className="branch-bar__field">
        <span>{t('branch.compare')}</span>
        <SearchSelect
          options={others}
          value={baseBranch}
          disabled={others.length === 0}
          label={t('branch.compareHint')}
          placeholder={others.length === 0 ? t('branch.none') : t('branch.search')}
          emptyText={t('branch.noMatch')}
          onSelect={setBaseBranch}
        />
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
