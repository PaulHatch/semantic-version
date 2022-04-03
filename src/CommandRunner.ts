// Using require instead of import to support integration testing
import * as exec from '@actions/exec';
import * as core from '@actions/core';

export const cmd = async (command: string, ...args: any): Promise<string> => {
    let output = '', errors = '';
    const options = {
        silent: true,
        listeners: {
            stdout: (data: any) => { output += data.toString(); },
            stderr: (data: any) => { errors += data.toString(); },
            ignoreReturnCode: true,
            silent: true
        }
    };

    try {
        await exec.exec(command, args, options);
    } catch (err) {
        //core.info(`The command cd '${command} ${args.join(' ')}' failed: ${err}`);
    }

    if (errors !== '') {
        //core.info(`stderr: ${errors}`);
    }

    return output;
};