import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const artifacts = resolve(root, '../../artifacts/npm')
mkdirSync(artifacts, { recursive: true })
assert(process.env.npm_execpath, 'Run through npm run test:package')
const npm = (args, cwd = root) => execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, stdio: 'inherit' })
npm(['pack', '--pack-destination', artifacts])
const consumer = mkdtempSync(resolve(artifacts, 'consumer-'))
writeFileSync(resolve(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
npm(['install', '--ignore-scripts', '--no-audit', resolve(artifacts, 'brightertools-auth-react-2.1.1.tgz'), 'react@19.3.0', 'react-dom@19.3.0', 'react-router-dom@7.18.4', 'typescript@7.0.2', '@types/react@19.3.0', '@types/react-dom@19.3.0'], consumer)
const code = `import * as auth from '@brightertools/auth-react';
import * as session from '@brightertools/auth-react/session';
import * as recaptcha from '@brightertools/auth-react/recaptcha';
if (!Object.keys(auth).length || !Object.keys(session).length || !Object.keys(recaptcha).length) throw new Error('Missing exports');
console.log('Packed native Node ESM entry points loaded');`
writeFileSync(resolve(consumer, 'smoke.mjs'), code)
writeFileSync(resolve(consumer, 'smoke.ts'), code)
execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'inherit' })
npm(['exec', '--', 'tsc', '--noEmit', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--strict', 'smoke.ts'], consumer)
