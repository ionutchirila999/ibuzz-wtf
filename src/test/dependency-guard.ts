// Offline checks that catch dependency drift and unsafe build overrides before publishing.
// Pure functions take file contents so they can be tested with fixtures.

type DepMap = Record<string, string>;
export type PackageJson = {
  dependencies?: DepMap;
  devDependencies?: DepMap;
  overrides?: DepMap;
};
export type BunLock = {
  workspaces: Record<string, { dependencies?: DepMap; devDependencies?: DepMap }>;
  overrides?: DepMap;
  packages: Record<string, unknown[]>;
};

/** bun.lock is JSON with trailing commas. */
export function parseBunLock(text: string): BunLock {
  return JSON.parse(text.replace(/,(\s*[}\]])/g, "$1")) as BunLock;
}

/** package.json specifiers must match what the lockfile was resolved from. */
export function findLockfileDrift(pkg: PackageJson, lock: BunLock): string[] {
  const ws = lock.workspaces[""] ?? {};
  const problems: string[] = [];
  for (const section of ["dependencies", "devDependencies"] as const) {
    const wanted = pkg[section] ?? {};
    const locked = ws[section] ?? {};
    for (const [name, spec] of Object.entries(wanted)) {
      if (locked[name] !== spec) {
        problems.push(`${section}.${name}: package.json "${spec}" but lockfile "${locked[name] ?? "missing"}"`);
      }
    }
    for (const name of Object.keys(locked)) {
      if (!(name in wanted)) problems.push(`${section}.${name}: in lockfile but not in package.json`);
    }
  }
  const pkgOverrides = pkg.overrides ?? {};
  const lockOverrides = lock.overrides ?? {};
  for (const name of new Set([...Object.keys(pkgOverrides), ...Object.keys(lockOverrides)])) {
    if (pkgOverrides[name] !== lockOverrides[name]) {
      problems.push(`overrides.${name}: package.json "${pkgOverrides[name] ?? "missing"}" but lockfile "${lockOverrides[name] ?? "missing"}"`);
    }
  }
  return problems;
}

/** Package name for a bare import specifier such as "entities/lib/decode.js" or "@scope/pkg/sub". */
export function packageNameOf(specifier: string): string | null {
  if (/^[./]/.test(specifier) || specifier.startsWith("~") || specifier === "@") return null;
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) return parts.length >= 2 && parts[1] ? `${parts[0]}/${parts[1]}` : null;
  return parts[0] || null;
}

/** Keys of `alias: { ... }` objects in a Vite config source. */
export function extractAliasKeys(configSource: string): string[] {
  const keys: string[] = [];
  const blockRe = /alias\s*:\s*\{([^}]*)\}/g;
  for (const block of configSource.matchAll(blockRe)) {
    const body = block[1] ?? "";
    for (const m of body.matchAll(/(?:^|[,{\s])(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$-]*))\s*:/g)) {
      const key = m[1] ?? m[2] ?? m[3];
      if (key) keys.push(key);
    }
  }
  return keys;
}

/**
 * An alias that redirects an npm package to a single copy is unsafe when the lockfile
 * installs a different, nested copy for some dependant — that dependant needs another version.
 */
export function findIncompatibleAliases(configSource: string, lock: BunLock): string[] {
  const problems: string[] = [];
  const keys = Object.keys(lock.packages);
  for (const alias of extractAliasKeys(configSource)) {
    const name = packageNameOf(alias);
    if (!name || !(name in lock.packages)) continue;
    const nested = keys.filter((k) => k.endsWith(`/${name}`) && k !== name && !k.endsWith(`/${name}/${name}`));
    for (const key of nested) {
      const dependant = key.slice(0, -(name.length + 1));
      const version = String(lock.packages[key]?.[0] ?? "").split("@").pop();
      problems.push(`alias "${alias}" forces one copy of ${name}, but ${dependant} needs its own ${name}@${version}`);
    }
  }
  return problems;
}

/** Paths into node_modules referenced by the config must exist. */
export function findMissingNodeModulePaths(configSource: string, exists: (p: string) => boolean): string[] {
  const paths = [...configSource.matchAll(/["'](node_modules\/[^"']+)["']/g)].map((m) => m[1] as string);
  return paths.filter((p) => !exists(p)).map((p) => `config references missing file ${p}`);
}

/** Marking modules external breaks the server bundle, which must be fully self-contained. */
export function findExternalModules(configSource: string): string[] {
  return /\bexternal\s*:/.test(configSource) ? ["vite config marks modules as external; the server bundle must include every package"] : [];
}
