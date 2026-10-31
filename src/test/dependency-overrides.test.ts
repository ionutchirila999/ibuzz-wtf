import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  findExternalModules,
  findIncompatibleAliases,
  findLockfileDrift,
  findMissingNodeModulePaths,
  parseBunLock,
  type PackageJson,
} from "./dependency-guard";

const root = path.resolve(__dirname, "../..");
const read = (f: string) => readFileSync(path.join(root, f), "utf8");
const pkg = JSON.parse(read("package.json")) as PackageJson;
const lock = parseBunLock(read("bun.lock"));
const viteConfig = read("vite.config.ts");

describe("dependency guard (project)", () => {
  it("package.json versions match the lockfile", () => {
    expect(findLockfileDrift(pkg, lock)).toEqual([]);
  });
  it("build aliases do not force an incompatible package copy", () => {
    expect(findIncompatibleAliases(viteConfig, lock)).toEqual([]);
  });
  it("build config only points at files that exist", () => {
    expect(findMissingNodeModulePaths(viteConfig, (p) => existsSync(path.join(root, p)))).toEqual([]);
  });
  it("build config keeps every package in the server bundle", () => {
    expect(findExternalModules(viteConfig)).toEqual([]);
  });
});

describe("dependency guard (detects past failures)", () => {
  const fixtureLock = parseBunLock(`{
    "workspaces": { "": { "dependencies": { "@radix-ui/react-label": "^2.1.8", }, }, },
    "packages": {
      "entities": ["entities@6.0.1", "", {}],
      "@react-email/render": ["@react-email/render@2.1.0", "", {}],
      "@react-email/render/entities": ["entities@4.5.0", "", {}],
    },
  }`);

  it("flags a package.json version that differs from the lockfile", () => {
    const drift = findLockfileDrift({ dependencies: { "@radix-ui/react-label": "^1.1.8" } }, fixtureLock);
    expect(drift).toHaveLength(1);
    expect(drift[0]).toContain("@radix-ui/react-label");
  });

  it("flags an alias that forces entities 6 onto a package needing entities 4", () => {
    const config = `resolve: { alias: { "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"), entities: x } }`;
    const problems = findIncompatibleAliases(config, fixtureLock);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toContain("@react-email/render needs its own entities@4.5.0");
  });

  it("flags a config path into node_modules that does not exist", () => {
    const config = `"node_modules/entities/lib/decode.js"`;
    expect(findMissingNodeModulePaths(config, () => false)).toHaveLength(1);
  });

  it("flags modules marked external", () => {
    expect(findExternalModules(`ssr: { external: ["x"] }`)).toHaveLength(1);
  });
});
