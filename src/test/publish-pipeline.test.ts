// Regression tests: publishing runs `vite build`. With an incompatible dependency override,
// that real build must stop at the dependency guard before any bundling happens.
// Each case runs a real production build in a temporary copy; the real project files are never changed.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const VITE_BLOCK = '\n  vite: {\n';

type Case = {
  name: string;
  /** Inserted at the top of the `vite: { ... }` block in vite.config.ts. */
  viteConfig?: string;
  /** Changes applied to the copied package.json. */
  pkg?: (pkg: { dependencies: Record<string, string>; overrides?: Record<string, string> }) => void;
  expected: string;
};

const cases: Case[] = [
  {
    name: 'forcing one copy of entities onto the email renderer (the original publish failure)',
    viteConfig: `resolve: { alias: { entities: "/forced/entities" } },`,
    expected: '@react-email/render needs its own entities@4.5.0',
  },
  {
    name: 'forcing one copy of the email renderer onto the email components',
    viteConfig: `resolve: { alias: { "@react-email/render": "/forced/render" } },`,
    expected: '@react-email/components needs its own @react-email/render@2.0.6',
  },
  {
    name: 'forcing ajv 6 onto the offline-support builder that needs ajv 8',
    viteConfig: `resolve: { alias: { "ajv": "/forced/ajv" } },`,
    expected: 'workbox-build needs its own ajv@8.20.0',
  },
  {
    name: 'a subpath alias that still forces one copy of entities',
    viteConfig: `resolve: { alias: { "entities/lib/decode.js": "/forced/decode.js" } },`,
    expected: '@react-email/render needs its own entities@4.5.0',
  },
  {
    name: 'an alias pointing at a node_modules file that does not exist',
    viteConfig: `resolve: { alias: { "@ibuzz/missing": "node_modules/does-not-exist/index.js" } },`,
    expected: 'config references missing file node_modules/does-not-exist/index.js',
  },
  {
    name: 'marking packages external so the server bundle is incomplete',
    viteConfig: `ssr: { external: ["@react-email/render"] },`,
    expected: 'server bundle must include every package',
  },
  {
    name: 'a package.json override the lockfile was not resolved with',
    pkg: (p) => {
      p.overrides = { ...(p.overrides ?? {}), entities: '6.0.1' };
    },
    expected: `overrides.entities: package.json "6.0.1"`,
  },
  {
    name: 'a package.json version that differs from the lockfile (the label publish failure)',
    pkg: (p) => {
      p.dependencies['@radix-ui/react-label'] = '^1.1.8';
    },
    expected: `dependencies.@radix-ui/react-label: package.json "^1.1.8"`,
  },
];

function makeProjectCopy(c: Case): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ibuzz-publish-guard-'));
  for (const f of ['package.json', 'bun.lock', 'tsconfig.json', 'bunfig.toml']) {
    if (existsSync(path.join(root, f))) cpSync(path.join(root, f), path.join(dir, f));
  }
  cpSync(path.join(root, 'tooling'), path.join(dir, 'tooling'), { recursive: true });
  for (const d of ['node_modules', 'src', 'public'])
    symlinkSync(path.join(root, d), path.join(dir, d), 'dir');

  let config = readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  if (c.viteConfig) config = config.replace(VITE_BLOCK, `${VITE_BLOCK}    ${c.viteConfig}\n`);
  writeFileSync(path.join(dir, 'vite.config.ts'), config);

  if (c.pkg) {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    c.pkg(pkg);
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
  }
  return dir;
}

describe('publishing pipeline dependency guard', () => {
  const dirs: string[] = [];

  beforeAll(() => {
    const config = readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    expect(config).toContain('dependencyGuard(__dirname)');
    expect(config).toContain(VITE_BLOCK);
  });

  afterAll(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
  });

  it.each(cases)(
    'stops the production build before bundling: $name',
    (c) => {
      const dir = makeProjectCopy(c);
      dirs.push(dir);
      const result = spawnSync(path.join(root, 'node_modules/.bin/vite'), ['build'], {
        cwd: dir,
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: 'production' },
        timeout: 120_000,
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status).not.toBe(0);
      expect(output).toContain('Dependency check failed — publish stopped before building');
      expect(output).toContain(c.expected);
      expect(output).not.toMatch(/transforming|built in/);
      expect(existsSync(path.join(dir, 'dist'))).toBe(false);
    },
    150_000,
  );
});
