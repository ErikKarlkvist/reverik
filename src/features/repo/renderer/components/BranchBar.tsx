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
 * Brancherna under repokortet: den reviewen tittar på och den man jämför mot.
 * Ingen checkout görs, valen sparas per appflik och repo.
 */
export function BranchBar({ onRunReview }: Props): JSX.Element | null {
  const { repo, busy, branches, headBranch, setHeadBranch, baseBranch, setBaseBranch } = useRepo();
  if (!repo?.isGit) return null;
  const others = branches.filter((b) => b !== headBranch);

  return (
    <div className="branch-bar">
      <label className="branch-bar__field">
        <span>
          <Icon name="branch" size="sm" /> {t('branch.from')}
        </span>
        <SearchSelect
          options={branches}
          value={headBranch}
          disabled={busy || branches.length === 0}
          label={t('branch.fromHint')}
          placeholder={t('branch.search')}
          emptyText={t('branch.noMatch')}
          onSelect={setHeadBranch}
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
          disabled={busy || headBranch === null || baseBranch === null}
          title={t('branch.runReviewHint')}
          onClick={() => {
            if (headBranch !== null && baseBranch !== null) onRunReview(baseBranch, headBranch);
          }}
        >
          <Icon name="warning" size="sm" /> {t('branch.runReview')}
        </button>
      )}
    </div>
  );
}
