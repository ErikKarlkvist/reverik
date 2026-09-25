import { type JSX } from 'react';
import { type RepoInfo } from '../../model/repo';

export function RepoCard({ repo }: { repo: RepoInfo }): JSX.Element {
  return (
    <div className="repo-card">
      <div className="repo-card__name" title={repo.path}>
        {repo.name}
      </div>
      <div className="repo-card__meta">
        {repo.isGit ? (repo.branch ?? 'frånkopplad HEAD') : 'ingen git'} · {repo.fileCount} filer
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
    </div>
  );
}
