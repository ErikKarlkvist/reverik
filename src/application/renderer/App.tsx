import { type JSX } from 'react';
import { RepoProvider } from '@/features/repo';
import { AppShell } from './AppShell';

export function App(): JSX.Element {
  return (
    <RepoProvider>
      <AppShell />
    </RepoProvider>
  );
}
