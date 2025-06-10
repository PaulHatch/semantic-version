"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugManager = void 0;
/** Utility class for managing debug mode and diagnostic information */
class DebugManager {
    constructor() {
        this.debugEnabled = false;
        this.replayMode = false;
        this.diagnosticInfo = null;
    }
    /** Returns the singleton instance of the DebugManager */
    static getInstance() {
        if (!DebugManager.instance) {
            DebugManager.instance = new DebugManager();
        }
        return DebugManager.instance;
    }
    /** Clears the singleton instance of the DebugManager (used for testing) */
    static clearState() {
        DebugManager.instance = new DebugManager();
    }
    /** Returns true if debug mode is enabled */
    isDebugEnabled() {
        return this.debugEnabled;
    }
    /** Returns true if replay mode is enabled */
    isReplayMode() {
        return this.replayMode;
    }
    initializeConfig(config) {
        if (config.debug) {
            this.setDebugEnabled(true);
        }
        else if (config.replay.length > 0) {
            this.replayFromDiagnostics(config.replay);
        }
    }
    /** Enables or disables debug mode, also clears any existing diagnostics info */
    setDebugEnabled(enableDebug = true) {
        this.debugEnabled = enableDebug;
        this.replayMode = false;
        this.diagnosticInfo = new DiagnosticInfo();
    }
    /** Enables replay mode and loads the diagnostic information from the specified string */
    replayFromDiagnostics(diagnostics) {
        this.debugEnabled = false;
        this.replayMode = true;
        this.diagnosticInfo = JSON.parse(diagnostics);
    }
    /** Returns a JSON string containing the diagnostic information for this run */
    getDebugOutput(emptyRepo = false) {
        return this.isDebugEnabled() ? JSON.stringify(this.diagnosticInfo) : "";
    }
    /** Records a command and its output for diagnostic purposes */
    recordCommand(command, args, output, stderr, error) {
        var _a;
        if (this.isDebugEnabled()) {
            (_a = this.diagnosticInfo) === null || _a === void 0 ? void 0 : _a.recordCommand(command, args, output, stderr, error);
        }
    }
    /** Replays the specified command and returns the output */
    replayCommand(command, args) {
        if (this.diagnosticInfo === null) {
            throw new Error("No diagnostic information available for replay");
        }
        const commandResult = this.diagnosticInfo.commands.find((c) => c.command === command &&
            JSON.stringify(c.args) === JSON.stringify(args));
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
exports.DebugManager = DebugManager;
/** Represents a CLI command result */
class CommandResult {
    constructor(command, args, output, stderr, error) {
        this.command = command;
        this.args = args;
        this.output = output;
        this.stderr = stderr;
        this.error = error;
    }
}
/** Represents the result of the commands executed for a run */
class DiagnosticInfo {
    constructor() {
        this.commands = [];
        this.empty = false;
    }
    recordCommand(command, args, output, stderr, error) {
        this.commands.push(new CommandResult(command, args, output, stderr, error));
    }
}
