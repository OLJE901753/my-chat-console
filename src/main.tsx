import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

// Sentry (env-guarded, avoid Vite import-analysis)
if (import.meta.env.VITE_SENTRY_DSN) {
  try {
    // Use Function constructor to avoid static analysis of import()
    // eslint-disable-next-line no-new-func
    const dynamicImport: (m: string) => Promise<any> = new Function(
      'm',
      'return import(m)'
    ) as unknown as (m: string) => Promise<any>

    dynamicImport('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN as string,
          tracesSampleRate: 0.1,
          integrations: [],
          enabled: true,
        })
      })
      .catch(() => void 0)
  } catch {
    // ignore if dynamic import mechanism is unavailable
  }
}

createRoot(document.getElementById("root")!).render(<App />);
