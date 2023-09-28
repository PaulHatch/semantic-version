
import { ActionConfig } from '../ActionConfig';
import { DefaultTagFormatter } from './DefaultTagFormatter';

/** Default tag formatter which allows a prefix to be specified */
export class BranchVersioningTagFormatter extends DefaultTagFormatter {

    private major: number;
    private minor?: number;

    private getRegex(pattern: string) {
        if (/^\/.+\/[i]*$/.test(pattern)) {
            const regexEnd = pattern.lastIndexOf('/');
            const parsedFlags = pattern.slice(pattern.lastIndexOf('/') + 1);
            return new RegExp(pattern.slice(1, regexEnd), parsedFlags);
        }
        return new RegExp(pattern);
    }

    constructor(config: ActionConfig, private branchName: string) {
        super(config);
        const pattern = config.versionFromBranch === true ?
            new RegExp("[0-9]+.[0-9]+$|[0-9]+$") :
            this.getRegex(config.versionFromBranch as string);
        const result = pattern.exec(branchName);

        let branchVersion: string;
        switch (result?.length) {
            case 1:
                branchVersion = result[0];
                break;
            case 2:
                branchVersion = result[1];
                break;
            default:
                throw new Error(`Unable to parse version from branch named '${branchName}' using pattern '${pattern}'`);
        }

        const versionValues = branchVersion.split('.');
        if (versionValues.length > 2) {
            throw new Error(`The version string '${branchVersion}' parsed from branch '${branchName}' is invalid. It must be in the format 'major.minor' or 'major'`);
        }
        this.major = parseInt(versionValues[0]);
        if (isNaN(this.major)) {
            throw new Error(`The major version '${versionValues[0]}' parsed from branch '${branchName}' is invalid. It must be a number.`);
        }
        if (versionValues.length > 1) {
            this.minor = parseInt(versionValues[1]);
            if (isNaN(this.minor)) {
                throw new Error(`The minor version '${versionValues[1]}' parsed from branch '${branchName}' is invalid. It must be a number.`);
            }
        }
    }

    override IsValid(tag: string): boolean {
        if (!super.IsValid(tag)) {
            return false;
        }

        const parsed = super.Parse(tag);
        if (parsed[0] !== this.major) {
            return false;
        }
        if (this.minor !== undefined && parsed[1] !== this.minor) {
            return false;
        }
        return true;
    }
    
    override Parse(tag: string): [major: number, minor: number, patch: number] {
        const parsed = super.Parse(tag);
        return [this.major, this.minor || parsed[1], parsed[2]];
    }
}