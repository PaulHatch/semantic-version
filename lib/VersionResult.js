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
     * @param formattedVersion - The formatted semantic version
     * @param versionTag - The string to be used as a Git tag
     * @param changed - True if the version was changed, otherwise false
     * @param authors - Authors formatted according to the format mode (e.g. JSON, CSV, YAML, etc.)
     * @param currentCommit - The current commit hash
     */
    constructor(major, minor, patch, increment, formattedVersion, versionTag, changed, authors, currentCommit) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.increment = increment;
        this.formattedVersion = formattedVersion;
        this.versionTag = versionTag;
        this.changed = changed;
        this.authors = authors;
        this.currentCommit = currentCommit;
    }
}
exports.VersionResult = VersionResult;
