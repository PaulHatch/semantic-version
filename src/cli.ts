#!/usr/bin/env node

import { Command } from "commander";
import { runAction } from "./action";
import { ConfigurationProvider } from "./ConfigurationProvider";
import { ActionConfig } from "./ActionConfig";
import * as process from "process";

const program = new Command();

program
  .name("semantic-version")
  .description("Automated semantic versioning for Git repositories")
  .version(process.env.SEMANTIC_VERSION || "0.0.0-dev")
  .option(
    "-B, --branch <branch>",
    "Specific branch to analyze (default: current HEAD)",
    "HEAD",
  )
  .option("-t, --tag-prefix <prefix>", 'Version tag prefix (e.g., "v")', "v")
  .option(
    "-p, --path <path>",
    "Path to check for changes (multiple paths separated by spaces)",
    "",
  )
  .option("-n, --namespace <namespace>", "Namespace for version tags", "")
  .option(
    "-M, --major-pattern <pattern>",
    "Regex pattern for major version bumps",
    "/!:|BREAKING CHANGE:/",
  )
  .option("--major-flags <flags>", "Flags for major pattern regex", "")
  .option(
    "-m, --minor-pattern <pattern>",
    "Regex pattern for minor version bumps",
    "/feat(\\(.+\\))?:/",
  )
  .option("--minor-flags <flags>", "Flags for minor pattern regex", "")
  .option(
    "-i, --ignore-commits-pattern <pattern>",
    "Pattern to match commits that should be ignored when calculating version",
    "",
  )
  .option(
    "--version-format <format>",
    "Version format template",
    "${major}.${minor}.${patch}",
  )
  .option("-b, --bump-each-commit", "Bump version for each commit", false)
  .option(
    "--bump-each-commit-patch-pattern <pattern>",
    "Pattern for patch bumps when bump-each-commit is enabled",
    "",
  )
  .option(
    "-s, --search-commit-body",
    "Search commit body for version patterns",
    false,
  )
  .option("-d, --debug", "Enable debug output", false)
  .option(
    "--version-from-branch [pattern]",
    "Use branch name for version selection (optionally provide a regex pattern)",
  )
  .option(
    "--enable-prerelease-mode",
    "Prevents pre-v1.0.0 major version increments",
    false,
  )
  .option(
    "--user-format-type <type>",
    "Output format for users (csv, json)",
    "csv",
  )
  .option("--format <format>", "Output format (json, text)", "text")
  .action(async (options) => {
    try {
      // Create ActionConfig from CLI options
      const config = new ActionConfig();
      config.branch = options.branch;
      config.tagPrefix = options.tagPrefix;
      config.versionFormat = options.versionFormat;
      config.changePath = options.path;
      config.namespace = options.namespace;
      config.majorPattern = options.majorPattern;
      config.majorFlags = options.majorFlags || "";
      config.minorPattern = options.minorPattern;
      config.minorFlags = options.minorFlags || "";
      config.ignoreCommitsPattern = options.ignoreCommitsPattern || "";
      config.bumpEachCommit = options.bumpEachCommit;
      config.bumpEachCommitPatchPattern =
        options.bumpEachCommitPatchPattern || "";
      config.searchCommitBody = options.searchCommitBody;
      // versionFromBranch can be true (flag only) or a string (custom pattern)
      config.versionFromBranch = options.versionFromBranch ?? false;
      config.enablePrereleaseMode = options.enablePrereleaseMode;
      config.userFormatType = options.userFormatType;
      config.debug = options.debug;

      // Create ConfigurationProvider with the config
      const configProvider = new ConfigurationProvider(config);

      const result = await runAction(configProvider);

      if (options.format === "json") {
        console.log(
          JSON.stringify(
            {
              version: result.formattedVersion,
              versionTag: result.versionTag,
              major: result.major,
              minor: result.minor,
              patch: result.patch,
              increment: result.increment,
              versionType: result.versionType,
              changed: result.changed,
              isTagged: result.isTagged,
              authors: result.authors,
              currentCommit: result.currentCommit,
              previousCommit: result.previousCommit,
              previousVersion: result.previousVersion,
            },
            null,
            2,
          ),
        );
      } else {
        console.log(result.formattedVersion);
        if (options.debug) {
          console.error("Version details:");
          console.error(`  Major: ${result.major}`);
          console.error(`  Minor: ${result.minor}`);
          console.error(`  Patch: ${result.patch}`);
          console.error(`  Type: ${result.versionType}`);
          console.error(`  Changed: ${result.changed}`);
          if (result.previousVersion) {
            console.error(`  Previous: ${result.previousVersion}`);
          }
        }
      }

      process.exit(0);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      if (options.debug && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
