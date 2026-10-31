// Runs the dependency guard before any production build (publishing runs `vite build`),
// so incompatible versions or overrides stop the publish before bundling starts.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import {
  findExternalModules,
  findIncompatibleAliases,
  findLockfileDrift,
  findMissingNodeModulePaths,
  parseBunLock,
  type PackageJson,
} from "../src/test/dependency-guard";

export function runDependencyGuard(root: string): string[] {
  const read = (f: string) => readFileSync(path.join(root, f), "utf8");
  const pkg = JSON.parse(read("package.json")) as PackageJson;
  const lock = parseBunLock(read("bun.lock"));
  const config = read("vite.config.ts");
  return [
    ...findLockfileDrift(pkg, lock),
    ...findIncompatibleAliases(config, lock),
    ...findMissingNodeModulePaths(config, (p) => existsSync(path.join(root, p))),
    ...findExternalModules(config),
  ];
}

export function dependencyGuard(root: string): Plugin {
  return {
    name: "ibuzz-dependency-guard",
    apply: "build",
    enforce: "pre",
    config() {
      const problems = runDependencyGuard(root);
      if (problems.length) {
        throw new Error(`Dependency check failed — publish stopped before building:\n- ${problems.join("\n- ")}`);
      }
    },
  };
}
