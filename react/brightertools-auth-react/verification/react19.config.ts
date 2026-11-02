import { defineConfig } from "vitest/config";
import path from "node:path";
const consumer = process.env.AUTH_REACT_CONSUMER_ROOT;
if (!consumer) throw new Error("Set AUTH_REACT_CONSUMER_ROOT to an installed React 19 consumer directory.");
const modules = path.resolve(consumer, "node_modules");
export default defineConfig({
  resolve: { alias: [
    { find: /^@testing-library\/react$/, replacement: path.join(modules, "@testing-library/react/dist/index.js") },
    { find: /^react$/, replacement: path.join(modules, "react/index.js") },
    { find: /^react\/(.*)$/, replacement: path.join(modules, "react/$1") },
    { find: /^react-dom$/, replacement: path.join(modules, "react-dom/index.js") },
    { find: /^react-dom\/(.*)$/, replacement: path.join(modules, "react-dom/$1") }
  ] },
  test: { environment: "jsdom", setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/userAdministrationParity.test.tsx", "src/tests/invitationManagementPanel.test.tsx", "src/tests/invitationWorkspacePresentation.test.tsx", "verification/react19.consumer.tsx"],
    server: { deps: { inline: [/@testing-library\/react/] } }
  }
});
