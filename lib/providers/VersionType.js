"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionType = void 0;
/** Indicates the type of change a particular version change represents */
var VersionType;
(function (VersionType) {
    /** Indicates a major version change */
    VersionType[VersionType["Major"] = 0] = "Major";
    /** Indicates a minor version change */
    VersionType[VersionType["Minor"] = 1] = "Minor";
    /** Indicates a patch version change */
    VersionType[VersionType["Patch"] = 2] = "Patch";
    /** Indicates no change--generally this means that the current commit is already tagged with a version */
    VersionType[VersionType["None"] = 3] = "None";
})(VersionType = exports.VersionType || (exports.VersionType = {}));
