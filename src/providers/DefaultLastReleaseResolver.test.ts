import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ActionConfig } from "../ActionConfig.js";
import { DebugManager } from "../DebugManager.js";
import { DefaultTagFormatter } from "../formatting/DefaultTagFormatter.js";

const timeout = 30000;

let repoDirectory: string;
let originalCwd: string;
let warnings: string[];

// ESM namespaces are immutable, so @actions/core is replaced before the resolver imports it.
jest.unstable_mockModule("@actions/core", () => ({
  warning: (message: string | Error) => {
    warnings.push(message.toString());
  },
}));
const { DefaultLastReleaseResolver } =
  await import("./DefaultLastReleaseResolver.js");

const run = (command: string) =>
  cp.execSync(command, { cwd: repoDirectory, stdio: "pipe" }).toString().trim();

const makeCommit = (msg: string) => {
  fs.writeFileSync(path.join(repoDirectory, `file${Date.now()}`), msg);
  run("git add --all");
  run(`git commit -m "${msg}"`);
};

const resolve = async () => {
  const config = new ActionConfig();
  const resolver = new DefaultLastReleaseResolver(config);
  return resolver.ResolveAsync(
    run("git rev-parse HEAD"),
    new DefaultTagFormatter(config),
  );
};

beforeEach(() => {
  DebugManager.clearState();
  repoDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "release-resolver-"));
  run("git init --initial-branch=master");
  run('git config user.name "Test User"');
  run('git config user.email "test@example.com"');
  run("git config commit.gpgsign false");
  // Warnings are only issued when a remote is configured
  run("git remote add origin https://example.invalid/repo.git");

  warnings = [];

  originalCwd = process.cwd();
  process.chdir(repoDirectory);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(repoDirectory, { recursive: true, force: true });
});

test(
  "Repository without tags warns that no tags are present",
  async () => {
    makeCommit("Initial Commit");

    const release = await resolve();

    expect(release.isTagged).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^No tags are present/);
  },
  timeout,
);

test(
  "Current commit holding the only release tag does not warn",
  async () => {
    makeCommit("Initial Commit");
    run("git tag v1.2.0");

    const release = await resolve();

    expect(release.isTagged).toBe(true);
    expect(release.currentMinor).toBe(2);
    expect(warnings).toHaveLength(0);
  },
  timeout,
);

test(
  "Commit after a release tag does not warn",
  async () => {
    makeCommit("Initial Commit");
    run("git tag v1.2.0");
    makeCommit("Second Commit");

    const release = await resolve();

    expect(release.isTagged).toBe(false);
    expect(release.minor).toBe(2);
    expect(warnings).toHaveLength(0);
  },
  timeout,
);

test(
  "Tags which do not match the configuration are counted in the warning",
  async () => {
    makeCommit("Initial Commit");
    run("git tag v1.0.0-rc.1");
    run("git tag v1.0.0.1");

    const release = await resolve();

    expect(release.isTagged).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^None of the 2 tags\(s\) found/);
  },
  timeout,
);
