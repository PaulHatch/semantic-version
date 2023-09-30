"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionType = void 0;
/** Indicates the type of change a particular version change represents */
var VersionType;
(function (VersionType) {
    /** Indicates a major version change */
    VersionType["Major"] = "Major";
    /** Indicates a minor version change */
    VersionType["Minor"] = "Minor";
    /** Indicates a patch version change */
    VersionType["Patch"] = "Patch";
    /** Indicates no change--generally this means that the current commit is already tagged with a version */
    VersionType["None"] = "None";
})(VersionType || (exports.VersionType = VersionType = {}));
