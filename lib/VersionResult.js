"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionResult = void 0;
/** Represents the total output for the action */
class VersionResult {
    /**
     * Creates a new result instance
     * @param major - The major version number
     * @param minor - The minor version number
     * @param patch - The patch version number
     * @param increment - The number of commits for this version (usually used to create version suffix)
     * @param versionType - The type of version, e.g. major, minor, patch
     * @param formattedVersion - The formatted semantic version
     * @param versionTag - The string to be used as a Git tag
     * @param changed - True if the version was changed, otherwise false
     * @param authors - Authors formatted according to the format mode (e.g. JSON, CSV, YAML, etc.)
     * @param currentCommit - The current commit hash
     * @param previousCommit - The previous commit hash
     * @param previousVersion - The previous version
     */
    constructor(major, minor, patch, increment, versionType, formattedVersion, versionTag, changed, authors, currentCommit, previousCommit, previousVersion) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.increment = increment;
        this.versionType = versionType;
        this.formattedVersion = formattedVersion;
        this.versionTag = versionTag;
        this.changed = changed;
        this.authors = authors;
        this.currentCommit = currentCommit;
        this.previousCommit = previousCommit;
        this.previousVersion = previousVersion;
    }
}
exports.VersionResult = VersionResult;
