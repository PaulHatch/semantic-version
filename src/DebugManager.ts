import { ActionConfig } from "./ActionConfig";

/** Utility class for managing debug mode and diagnostic information */
export class DebugManager {
  private constructor() {}

  private static instance: DebugManager;
  /** Returns the singleton instance of the DebugManager */
  public static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  /** Clears the singleton instance of the DebugManager (used for testing) */
  public static clearState() {
    DebugManager.instance = new DebugManager();
  }

  private debugEnabled: boolean = false;
  private replayMode: boolean = false;
  private diagnosticInfo: DiagnosticInfo | null = null;

  /** Returns true if debug mode is enabled */
  public isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  /** Returns true if replay mode is enabled */
  public isReplayMode(): boolean {
    return this.replayMode;
  }

  initializeConfig(config: ActionConfig) {
    if (config.debug) {
      this.setDebugEnabled(true);
    } else if (config.replay.length > 0) {
      this.replayFromDiagnostics(config.replay);
    }
  }

  /** Enables or disables debug mode, also clears any existing diagnostics info */
  public setDebugEnabled(enableDebug: boolean = true): void {
    this.debugEnabled = enableDebug;
    this.replayMode = false;
    this.diagnosticInfo = new DiagnosticInfo();
  }

  /** Enables replay mode and loads the diagnostic information from the specified string */
  public replayFromDiagnostics(diagnostics: string): void {
    this.debugEnabled = false;
    this.replayMode = true;
    this.diagnosticInfo = JSON.parse(diagnostics);
  }

  /** Returns a JSON string containing the diagnostic information for this run */
  public getDebugOutput(emptyRepo: boolean = false): string {
    return this.isDebugEnabled() ? JSON.stringify(this.diagnosticInfo) : "";
  }

  /** Records a command and its output for diagnostic purposes */
  public recordCommand(
    command: string,
    args: any[],
    output: string,
    stderr: string,
    error: any,
  ): void {
    if (this.isDebugEnabled()) {
      this.diagnosticInfo?.recordCommand(command, args, output, stderr, error);
    }
  }

  /** Replays the specified command and returns the output */
  public replayCommand(command: string, args: any[]): string {
    if (this.diagnosticInfo === null) {
      throw new Error("No diagnostic information available for replay");
    }

    const commandResult = this.diagnosticInfo.commands.find(
      (c) =>
        c.command === command &&
        JSON.stringify(c.args) === JSON.stringify(args),
    );
    if (!commandResult) {
      throw new Error(`No result found in diagnostic for command "${command}"`);
    }
    if (commandResult.error) {
      throw commandResult.error;
    }
    if (commandResult.stderr) {
      console.error(commandResult.stderr);
    }
    return commandResult.output;
  }
}

/** Represents a CLI command result */
class CommandResult {
  public command: string;
  public args: any[];
  public output: string;
  public stderr: string;
  public error: any;
  public constructor(
    command: string,
    args: any[],
    output: string,
    stderr: string,
    error: any,
  ) {
    this.command = command;
    this.args = args;
    this.output = output;
    this.stderr = stderr;
    this.error = error;
  }
}

/** Represents the result of the commands executed for a run */
class DiagnosticInfo {
  public commands: CommandResult[] = [];
  public empty: boolean = false;
  public recordCommand(
    command: string,
    args: any[],
    output: string,
    stderr: string,
    error: any,
  ): void {
    this.commands.push(new CommandResult(command, args, output, stderr, error));
  }
}
