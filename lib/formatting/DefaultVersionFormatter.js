"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultVersionFormatter = void 0;
class DefaultVersionFormatter {
    constructor(config) {
        this.formatString = config.versionFormat;
    }
    Format(versionInfo) {
        return this.formatString
            .replace('${major}', versionInfo.major.toString())
            .replace('${minor}', versionInfo.minor.toString())
            .replace('${patch}', versionInfo.patch.toString())
            .replace('${increment}', versionInfo.increment.toString());
    }
}
exports.DefaultVersionFormatter = DefaultVersionFormatter;
