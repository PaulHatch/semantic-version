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
exports.runAction = void 0;
const VersionResult_1 = require("./VersionResult");
const VersionType_1 = require("./providers/VersionType");
const UserInfo_1 = require("./providers/UserInfo");
const VersionInformation_1 = require("./providers/VersionInformation");
const DebugManager_1 = require("./DebugManager");
const core = __importStar(require("@actions/core"));
function runAction(configurationProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info("VAGO STARTING runAction");
        const currentCommitResolver = configurationProvider.GetCurrentCommitResolver();
        const lastReleaseResolver = configurationProvider.GetLastReleaseResolver();
        const commitsProvider = configurationProvider.GetCommitsProvider();
        const versionClassifier = configurationProvider.GetVersionClassifier();
        const versionFormatter = configurationProvider.GetVersionFormatter();
        const tagFormatter = configurationProvider.GetTagFormatter(yield currentCommitResolver.ResolveBranchNameAsync());
        const userFormatter = configurationProvider.GetUserFormatter();
        const debugManager = DebugManager_1.DebugManager.getInstance();
        if (yield currentCommitResolver.IsEmptyRepoAsync()) {
            core.info("VAGO REPO WAS EMPTY, returning default version information");
            const versionInfo = new VersionInformation_1.VersionInformation(0, 0, 0, 0, VersionType_1.VersionType.None, [], false, false);
            return new VersionResult_1.VersionResult(versionInfo.major, versionInfo.minor, versionInfo.patch, versionInfo.increment, versionInfo.type, versionFormatter.Format(versionInfo), tagFormatter.Format(versionInfo), versionInfo.changed, versionInfo.isTagged, userFormatter.Format("author", []), "", "", tagFormatter.Parse(tagFormatter.Format(versionInfo)).join("."), debugManager.getDebugOutput(true));
        }
        core.info("VAGO REPO IS NOT EMPTY, continuing with versioning");
        const currentCommit = yield currentCommitResolver.ResolveAsync();
        core.info("VAGO CURRENT COMMIT: " + currentCommit);
        const lastRelease = yield lastReleaseResolver.ResolveAsync(currentCommit, tagFormatter);
        core.info("VAGO LAST RELEASE: " +
            lastRelease.hash +
            " " +
            lastRelease.major +
            "." +
            lastRelease.minor +
            "." +
            lastRelease.patch);
        const commitSet = yield commitsProvider.GetCommitsAsync(lastRelease.hash, currentCommit);
        core.info("VAGO commit set le:" + commitSet.commits.length);
        core.info("VAGO commit set changed: " + commitSet.changed.toString());
        const classification = yield versionClassifier.ClassifyAsync(lastRelease, commitSet);
        core.info("VAGO classification: " + JSON.stringify(classification));
        const { isTagged } = lastRelease;
        const { major, minor, patch, increment, type, changed } = classification;
        // At this point all necessary data has been pulled from the database, create
        // version information to be used by the formatters
        let versionInfo = new VersionInformation_1.VersionInformation(major, minor, patch, increment, type, commitSet.commits, changed, isTagged);
        // Group all the authors together, count the number of commits per author
        const allAuthors = versionInfo.commits.reduce((acc, commit) => {
            const key = `${commit.author} <${commit.authorEmail}>`;
            acc[key] = acc[key] || { n: commit.author, e: commit.authorEmail, c: 0 };
            acc[key].c++;
            return acc;
        }, {});
        const authors = Object.values(allAuthors)
            .map((u) => new UserInfo_1.UserInfo(u.n, u.e, u.c))
            .sort((a, b) => b.commits - a.commits);
        return new VersionResult_1.VersionResult(versionInfo.major, versionInfo.minor, versionInfo.patch, versionInfo.increment, versionInfo.type, versionFormatter.Format(versionInfo), tagFormatter.Format(versionInfo), versionInfo.changed, versionInfo.isTagged, userFormatter.Format("author", authors), currentCommit, lastRelease.hash, `${lastRelease.major}.${lastRelease.minor}.${lastRelease.patch}`, debugManager.getDebugOutput());
    });
}
exports.runAction = runAction;
