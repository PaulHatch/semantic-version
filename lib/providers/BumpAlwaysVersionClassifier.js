"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BumpAlwaysVersionClassifier = void 0;
const DefaultVersionClassifier_1 = require("./DefaultVersionClassifier");
const VersionClassification_1 = require("./VersionClassification");
const VersionType_1 = require("./VersionType");
class BumpAlwaysVersionClassifier extends DefaultVersionClassifier_1.DefaultVersionClassifier {
    constructor(config) {
        super(config);
        this.enablePrereleaseMode = config.enablePrereleaseMode;
        this.patchPattern = !config.bumpEachCommitPatchPattern ?
            _ => true :
            this.parsePattern(config.bumpEachCommitPatchPattern, "", config.searchCommitBody);
    }
    ClassifyAsync(lastRelease, commitSet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lastRelease.currentPatch !== null) {
                return new VersionClassification_1.VersionClassification(VersionType_1.VersionType.None, 0, false, lastRelease.currentMajor, lastRelease.currentMinor, lastRelease.currentPatch);
            }
            let { major, minor, patch } = lastRelease;
            let type = VersionType_1.VersionType.None;
            let increment = 0;
            if (commitSet.commits.length === 0) {
                return new VersionClassification_1.VersionClassification(type, 0, false, major, minor, patch);
            }
            for (let commit of commitSet.commits.reverse()) {
                if (this.majorPattern(commit)) {
                    type = VersionType_1.VersionType.Major;
                }
                else if (this.minorPattern(commit)) {
                    type = VersionType_1.VersionType.Minor;
                }
                else if (this.patchPattern(commit) ||
                    (major === 0 && minor === 0 && patch === 0 && commitSet.commits.length > 0)) {
                    type = VersionType_1.VersionType.Patch;
                }
                else {
                    type = VersionType_1.VersionType.None;
                }
                if (this.enablePrereleaseMode && major === 0) {
                    switch (type) {
                        case VersionType_1.VersionType.Major:
                        case VersionType_1.VersionType.Minor:
                            minor += 1;
                            patch = 0;
                            increment = 0;
                            break;
                        case VersionType_1.VersionType.Patch:
                            patch += 1;
                            increment = 0;
                            break;
                        default:
                            increment++;
                            break;
                    }
                }
                else {
                    switch (type) {
                        case VersionType_1.VersionType.Major:
                            major += 1;
                            minor = 0;
                            patch = 0;
                            increment = 0;
                            break;
                        case VersionType_1.VersionType.Minor:
                            minor += 1;
                            patch = 0;
                            break;
                        case VersionType_1.VersionType.Patch:
                            patch += 1;
                            increment = 0;
                            break;
                        default:
                            increment++;
                            break;
                    }
                }
            }
            return new VersionClassification_1.VersionClassification(type, increment, true, major, minor, patch);
        });
    }
}
exports.BumpAlwaysVersionClassifier = BumpAlwaysVersionClassifier;
