// Using require instead of import to support integration testing
import * as exec from "@actions/exec";
import { DebugManager } from "./DebugManager";

export const cmd = async (command: string, ...args: any): Promise<string> => {
  const debugManager = DebugManager.getInstance();

  if (debugManager.isReplayMode()) {
    return debugManager.replayCommand(command, args);
  }

  let output = "",
    errors = "";
  const options = {
    silent: true,
    listeners: {
      stdout: (data: any) => {
        output += data.toString();
      },
      stderr: (data: any) => {
        errors += data.toString();
      },
      ignoreReturnCode: true,
      silent: true,
    },
  };

  let caughtError: any = null;
  try {
    await exec.exec(command, args, options);
  } catch (err) {
    caughtError = err;
  }

  debugManager.recordCommand(command, args, output, errors, caughtError);

  return output;
};
