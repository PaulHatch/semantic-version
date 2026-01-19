import * as cp from "child_process";
import * as path from "path";
import { runAction } from "./action";
import { ConfigurationProvider } from "./ConfigurationProvider";
import { ActionConfig } from "./ActionConfig";
import { DebugManager } from "./DebugManager";
import { VersionResult } from "./VersionResult";

export type TestInterface = "action" | "cli";

export interface TestRunner {
  runSemanticVersion(
    config: Partial<ActionConfig>,
    cwd: string,
  ): Promise<VersionResult>;
}

export class ActionTestRunner implements TestRunner {
  async runSemanticVersion(
    config: Partial<ActionConfig>,
    cwd: string,
  ): Promise<VersionResult> {
    DebugManager.clearState();
    const fullConfig = new ActionConfig();
    Object.assign(fullConfig, config);

    const originalCwd = process.cwd();
    try {
      process.chdir(cwd);
      return await runAction(new ConfigurationProvider(fullConfig));
    } finally {
      process.chdir(originalCwd);
    }
  }
}

export class CLITestRunner implements TestRunner {
  private cliPath: string;

  constructor() {
    this.cliPath = path.join(__dirname, "..", "lib", "cli.js");
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  async runSemanticVersion(
    config: Partial<ActionConfig>,
    cwd: string,
  ): Promise<VersionResult> {
    const args: string[] = ["node", this.cliPath, "--format", "json"];

    // Special case: changePath maps to --path
    const cliOptionOverrides: Record<string, string> = {
      changePath: "path",
    };

    // Dynamically build CLI arguments from config
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || value === null) continue;

      // Get CLI option name
      const cliOptionName = cliOptionOverrides[key] || this.toKebabCase(key);

      // Handle boolean flags
      if (typeof value === "boolean") {
        if (value) {
          args.push(`--${cliOptionName}`);
        }
      } else {
        // Handle string/number values
        args.push(`--${cliOptionName}`, String(value));
      }
    }

    try {
      // Use execFileSync instead of execSync to avoid shell escaping issues
      const output = cp.execFileSync("node", args.slice(1), {
        cwd,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"], // Capture stdout and stderr
      });

      // Parse JSON output - filter out warning lines that start with ::warning::
      const lines = output
        .split("\n")
        .filter((line) => !line.startsWith("::warning::"));

      // Find the start and end of JSON block
      const startIndex = lines.findIndex((line) => line.trim().startsWith("{"));
      const endIndex = lines.findIndex((line) => line.trim() === "}");

      if (startIndex === -1 || endIndex === -1) {
        throw new Error(`No JSON output found from CLI. Output was: ${output}`);
      }

      // Extract JSON lines and join them
      const jsonLines = lines.slice(startIndex, endIndex + 1);
      const jsonString = jsonLines.join("\n");

      let cliResult;
      try {
        cliResult = JSON.parse(jsonString);
      } catch (e) {
        throw new Error(
          `Failed to parse JSON. Output was: "${output}". JSON string extracted: "${jsonString}"`,
        );
      }

      // Map CLI output to VersionResult format
      return new VersionResult(
        cliResult.major,
        cliResult.minor,
        cliResult.patch,
        cliResult.increment,
        cliResult.versionType,
        cliResult.version,
        cliResult.versionTag,
        cliResult.changed,
        cliResult.isTagged,
        cliResult.authors,
        cliResult.currentCommit,
        cliResult.previousCommit,
        cliResult.previousVersion,
        "", // debugOutput - not returned by CLI
      );
    } catch (error: any) {
      if (error.stdout) {
        // Try to parse error output - filter out warning lines
        const errorOutput = error.stdout.toString();
        const lines = errorOutput
          .split("\n")
          .filter((line: string) => !line.startsWith("::warning::"));

        // Find the start and end of JSON block
        const startIndex = lines.findIndex((line: string) =>
          line.trim().startsWith("{"),
        );
        const endIndex = lines.findIndex((line: string) => line.trim() === "}");

        if (startIndex !== -1 && endIndex !== -1) {
          // Extract JSON lines and join them
          const jsonLines = lines.slice(startIndex, endIndex + 1);
          const jsonString = jsonLines.join("\n");

          let cliResult;
          try {
            cliResult = JSON.parse(jsonString);
          } catch (e) {
            throw new Error(
              `Failed to parse JSON from error output. Output was: "${errorOutput}". JSON string extracted: "${jsonString}"`,
            );
          }
          return new VersionResult(
            cliResult.major,
            cliResult.minor,
            cliResult.patch,
            cliResult.increment,
            cliResult.versionType,
            cliResult.version,
            cliResult.versionTag,
            cliResult.changed,
            cliResult.isTagged,
            cliResult.authors,
            cliResult.currentCommit,
            cliResult.previousCommit,
            cliResult.previousVersion,
            "", // debugOutput - not returned by CLI
          );
        }
      }
      throw error;
    }
  }
}

export function createTestRunner(type: TestInterface): TestRunner {
  switch (type) {
    case "action":
      return new ActionTestRunner();
    case "cli":
      return new CLITestRunner();
    default:
      throw new Error(`Unknown test interface: ${type}`);
  }
}
