import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

async function bootstrap(): Promise<void> {
  if (import.meta.env.DEV && !('api' in window)) {
    const { installMockBridge } = await import('./mockBridge');
    installMockBridge();
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('Hittar inte #root');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
