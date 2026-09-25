import { type JSX } from 'react';
import { AnalysisProvider } from '@/features/analysis';
import { RepoProvider, useRepo } from '@/features/repo';
import { TerminalProvider } from '@/features/terminal';
import { AppShell } from './AppShell';

export function App(): JSX.Element {
  return (
    <RepoProvider>
      <Providers>
        <AppShell />
      </Providers>
    </RepoProvider>
  );
}

/** Providers som beror på valt repo. */
function Providers({ children }: { children: JSX.Element }): JSX.Element {
  const { repo } = useRepo();
  return (
    <AnalysisProvider repoPath={repo?.path ?? null}>
      <TerminalProvider>{children}</TerminalProvider>
    </AnalysisProvider>
  );
}
