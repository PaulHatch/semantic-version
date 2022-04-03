"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionClassification = void 0;
/** The result of a version classification */
class VersionClassification {
    /**
     * Creates a new version classification result instance
     * @param type - The type of change the current range represents
     * @param increment - The number of commits which have this version, usually zero-based
     * @param changed - True if the version has changed, false otherwise
     * @param major - The major version number
     * @param minor - The minor version number
     * @param patch - The patch version number
     */
    constructor(type, increment, changed, major, minor, patch) {
        this.type = type;
        this.increment = increment;
        this.changed = changed;
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
}
exports.VersionClassification = VersionClassification;
