// Regression test: publishing runs `vite build`. With an incompatible dependency override in
// vite.config.ts, that real build must stop at the dependency guard before any bundling happens.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
// The override that broke publishing: forcing one copy of `entities` onto the email renderer.
const BAD_ALIAS = `resolve: { alias: { entities: "/forced/entities" } },`;

describe("publishing pipeline dependency guard", () => {
  let dir = "";

  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), "ibuzz-publish-guard-"));
    for (const f of ["package.json", "bun.lock", "tsconfig.json", "bunfig.toml"]) {
      if (existsSync(path.join(root, f))) cpSync(path.join(root, f), path.join(dir, f));
    }
    cpSync(path.join(root, "tooling"), path.join(dir, "tooling"), { recursive: true });
    for (const d of ["node_modules", "src", "public"]) symlinkSync(path.join(root, d), path.join(dir, d), "dir");
    const config = readFileSync(path.join(root, "vite.config.ts"), "utf8");
    expect(config).toContain("dependencyGuard(__dirname)");
    expect(config).toContain("\n  vite: {\n");
    writeFileSync(path.join(dir, "vite.config.ts"), config.replace("\n  vite: {\n", `\n  vite: {\n    ${BAD_ALIAS}\n`));
  });

  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("stops the production build before bundling when an incompatible override is present", () => {
    const result = spawnSync(path.join(root, "node_modules/.bin/vite"), ["build"], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production" },
      timeout: 120_000,
    });
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain("Dependency check failed — publish stopped before building");
    expect(output).toContain("@react-email/render needs its own entities@4.5.0");
    expect(output).not.toMatch(/transforming|built in/);
    expect(existsSync(path.join(dir, "dist"))).toBe(false);
  }, 150_000);
});
