"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchVersioningTagFormatter = void 0;
const DefaultTagFormatter_1 = require("./DefaultTagFormatter");
/** Default tag formatter which allows a prefix to be specified */
class BranchVersioningTagFormatter extends DefaultTagFormatter_1.DefaultTagFormatter {
    getRegex(pattern) {
        if (/^\/.+\/[i]*$/.test(pattern)) {
            const regexEnd = pattern.lastIndexOf('/');
            const parsedFlags = pattern.slice(pattern.lastIndexOf('/') + 1);
            return new RegExp(pattern.slice(1, regexEnd), parsedFlags);
        }
        return new RegExp(pattern);
    }
    constructor(config, branchName) {
        super(config);
        const pattern = config.versionFromBranch === true ?
            new RegExp("[0-9]+.[0-9]+$|[0-9]+$") :
            this.getRegex(config.versionFromBranch);
        const result = pattern.exec(branchName);
        if (result === null) {
            this.major = NaN;
            this.onVersionBranch = false;
            return;
        }
        let branchVersion;
        switch (result === null || result === void 0 ? void 0 : result.length) {
            case 1:
                branchVersion = result[0];
                break;
            case 2:
                branchVersion = result[1];
                break;
            default:
                throw new Error(`Unable to parse version from branch named '${branchName}' using pattern '${pattern}'`);
        }
        this.onVersionBranch = true;
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
    GetPattern() {
        let pattern = super.GetPattern();
        if (!this.onVersionBranch) {
            return pattern;
        }
        if (this.minor === undefined) {
            return pattern.replace('*[0-9].*[0-9].*[0-9]', `${this.major}.*[0-9].*[0-9]`);
        }
        return pattern.replace('*[0-9].*[0-9].*[0-9]', `${this.major}.${this.minor}.*[0-9]`);
    }
    IsValid(tag) {
        if (!this.onVersionBranch) {
            return super.IsValid(tag);
        }
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
    Parse(tag) {
        if (!this.onVersionBranch) {
            return super.Parse(tag);
        }
        const parsed = super.Parse(tag);
        return [this.major, this.minor || parsed[1], parsed[2]];
    }
}
exports.BranchVersioningTagFormatter = BranchVersioningTagFormatter;
