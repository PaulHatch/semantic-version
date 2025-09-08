"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.DefaultVersionClassifier = void 0;
const VersionClassification_1 = require("./VersionClassification");
const VersionType_1 = require("./VersionType");
const core = __importStar(require("@actions/core"));
class DefaultVersionClassifier {
    constructor(config) {
        const searchBody = config.searchCommitBody;
        this.majorPattern = this.parsePattern(config.majorPattern, config.majorFlags, searchBody);
        this.minorPattern = this.parsePattern(config.minorPattern, config.minorFlags, searchBody);
        this.enablePrereleaseMode = config.enablePrereleaseMode;
    }
    parsePattern(pattern, flags, searchBody) {
        if (/^\/.+\/[i]*$/.test(pattern)) {
            const regexEnd = pattern.lastIndexOf('/');
            const parsedFlags = pattern.slice(pattern.lastIndexOf('/') + 1);
            const regex = new RegExp(pattern.slice(1, regexEnd), parsedFlags || flags);
            return searchBody ?
                (commit) => regex.test(commit.subject) || regex.test(commit.body) :
                (commit) => regex.test(commit.subject);
        }
        else {
            const matchString = pattern;
            return searchBody ?
                (commit) => commit.subject.includes(matchString) || commit.body.includes(matchString) :
                (commit) => commit.subject.includes(matchString);
        }
    }
    getNextVersion(current, type) {
        if (this.enablePrereleaseMode && current.major === 0) {
            switch (type) {
                case VersionType_1.VersionType.Major:
                    return { major: current.major, minor: current.minor + 1, patch: 0 };
                case VersionType_1.VersionType.Minor:
                case VersionType_1.VersionType.Patch:
                    return { major: current.major, minor: current.minor, patch: current.patch + 1 };
                case VersionType_1.VersionType.None:
                    return { major: current.major, minor: current.minor, patch: current.patch };
                default:
                    throw new Error(`Unknown change type: ${type}`);
            }
        }
        switch (type) {
            case VersionType_1.VersionType.Major:
                return { major: current.major + 1, minor: 0, patch: 0 };
            case VersionType_1.VersionType.Minor:
                return { major: current.major, minor: current.minor + 1, patch: 0 };
            case VersionType_1.VersionType.Patch:
                return { major: current.major, minor: current.minor, patch: current.patch + 1 };
            case VersionType_1.VersionType.None:
                return { major: current.major, minor: current.minor, patch: current.patch };
            default:
                throw new Error(`Unknown change type: ${type}`);
        }
    }
    resolveCommitType(commitsSet) {
        if (commitsSet.commits.length === 0) {
            return { type: VersionType_1.VersionType.None, increment: 0, changed: commitsSet.changed };
        }
        const commits = commitsSet.commits.reverse();
        let index = 1;
        for (let commit of commits) {
            if (this.majorPattern(commit)) {
                return { type: VersionType_1.VersionType.Major, increment: commits.length - index, changed: commitsSet.changed };
            }
            index++;
        }
        index = 1;
        for (let commit of commits) {
            if (this.minorPattern(commit)) {
                return { type: VersionType_1.VersionType.Minor, increment: commits.length - index, changed: commitsSet.changed };
            }
            index++;
        }
        return { type: VersionType_1.VersionType.Patch, increment: commitsSet.commits.length - 1, changed: true };
    }
    ClassifyAsync(lastRelease, commitSet) {
        return __awaiter(this, void 0, void 0, function* () {
            core.info("VAGO DefaultVersionClassifier.ClassifyAsync called");
            const { type, increment, changed } = this.resolveCommitType(commitSet);
            core.info("VAGO DefaultVersionClassifier.ClassifyAsync: type: " + VersionType_1.VersionType[type] + ", increment: " + increment + ", changed: " + changed);
            const { major, minor, patch } = this.getNextVersion(lastRelease, type);
            core.info("VAGOO DefaultVersionClassifier.ClassifyAsync: major: " + major + ", minor: " + minor + ", patch: " + patch);
            if (lastRelease.currentPatch !== null) {
                core.info("VAGO DefaultVersionClassifier.ClassifyAsync: lastRelease.currentPatch is not null, using it to determine version classification");
                // If the current commit is tagged, we must use that version. Here we check if the version we have resolved from the
                // previous commits is the same as the current version. If it is, we will use the increment value, otherwise we reset
                // to zero. For example:
                // - commit 1 - v1.0.0+0
                // - commit 2 - v1.0.0+1
                // - commit 3 was tagged v2.0.0 - v2.0.0+0
                // - commit 4 - v2.0.1+0
                const versionsMatch = lastRelease.currentMajor === major && lastRelease.currentMinor === minor && lastRelease.currentPatch === patch;
                const currentIncrement = versionsMatch ? increment : 0;
                core.info("VAGO DefaultVersionClassifier.ClassifyAsync: versionsMatch: " + versionsMatch + ", currentIncrement: " + currentIncrement);
                core.info("VAGO DefaultVersionClassifier.ClassifyAsync: lastRelease.currentMajor: " + lastRelease.currentMajor);
                core.info("VAGO DefaultVersionClassifier.ClassifyAsync: lastRelease.currentMinor: " + lastRelease.currentMinor);
                core.info("VAGO DefaultVersionClassifier.ClassifyAsync: lastRelease.currentPatch: " + lastRelease.currentPatch);
                return new VersionClassification_1.VersionClassification(VersionType_1.VersionType.None, currentIncrement, false, lastRelease.currentMajor, lastRelease.currentMinor, lastRelease.currentPatch);
            }
            return new VersionClassification_1.VersionClassification(type, increment, changed, major, minor, patch);
        });
    }
}
exports.DefaultVersionClassifier = DefaultVersionClassifier;
