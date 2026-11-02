import { defineConfig } from 'vitest/config';
import path from 'node:path';
import baseline from './react19.config';
const modules = path.resolve(process.env.AUTH_REACT_CONSUMER_ROOT!, 'node_modules');
// Router must also come from the consumer, not the React 18 library dev install.
export default defineConfig({ ...baseline,
  resolve: { ...baseline.resolve, alias: [...(baseline.resolve!.alias as any[]),
    { find: /^react-router-dom$/, replacement: path.join(modules, 'react-router-dom/dist/index.mjs') },
    { find: /^react-router\/dom$/, replacement: path.join(modules, 'react-router/dist/development/dom-export.mjs') },
    { find: /^react-router$/, replacement: path.join(modules, 'react-router/dist/development/index.mjs') }
  ] },
  test: { ...baseline.test,
    include: ['src/tests/**/*.{test,spec}.{ts,tsx}', 'verification/react19.consumer.tsx'],
    server: { deps: { inline: [/@testing-library\/react/, /react-router/] } }
  }
});
