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
exports.runAction = void 0;
const VersionResult_1 = require("./VersionResult");
const VersionType_1 = require("./providers/VersionType");
const UserInfo_1 = require("./providers/UserInfo");
const VersionInformation_1 = require("./providers/VersionInformation");
function runAction(configurationProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentCommitResolver = configurationProvider.GetCurrentCommitResolver();
        const lastReleaseResolver = configurationProvider.GetLastReleaseResolver();
        const commitsProvider = configurationProvider.GetCommitsProvider();
        const versionClassifier = configurationProvider.GetVersionClassifier();
        const versionFormatter = configurationProvider.GetVersionFormatter();
        const tagFormmater = configurationProvider.GetTagFormatter();
        const userFormatter = configurationProvider.GetUserFormatter();
        if (yield currentCommitResolver.IsEmptyRepoAsync()) {
            let versionInfo = new VersionInformation_1.VersionInformation(0, 0, 0, 0, VersionType_1.VersionType.None, [], false);
            return new VersionResult_1.VersionResult(versionInfo.major, versionInfo.minor, versionInfo.patch, versionInfo.increment, versionFormatter.Format(versionInfo), tagFormmater.Format(versionInfo), versionInfo.changed, userFormatter.Format('author', []), '', '', '0.0.0');
        }
        const currentCommit = yield currentCommitResolver.ResolveAsync();
        const lastRelease = yield lastReleaseResolver.ResolveAsync(currentCommit, tagFormmater);
        const commitSet = yield commitsProvider.GetCommitsAsync(lastRelease.hash, currentCommit);
        const classification = yield versionClassifier.ClassifyAsync(lastRelease, commitSet);
        const { major, minor, patch, increment, type, changed } = classification;
        // At this point all necessary data has been pulled from the database, create
        // version information to be used by the formatters
        let versionInfo = new VersionInformation_1.VersionInformation(major, minor, patch, increment, type, commitSet.commits, changed);
        // Group all the authors together, count the number of commits per author
        const allAuthors = versionInfo.commits
            .reduce((acc, commit) => {
            const key = `${commit.author} <${commit.authorEmail}>`;
            acc[key] = acc[key] || { n: commit.author, e: commit.authorEmail, c: 0 };
            acc[key].c++;
            return acc;
        }, {});
        const authors = Object.values(allAuthors)
            .map((u) => new UserInfo_1.UserInfo(u.n, u.e, u.c))
            .sort((a, b) => b.commits - a.commits);
        return new VersionResult_1.VersionResult(versionInfo.major, versionInfo.minor, versionInfo.patch, versionInfo.increment, versionFormatter.Format(versionInfo), tagFormmater.Format(versionInfo), versionInfo.changed, userFormatter.Format('author', authors), currentCommit, lastRelease.hash, `${lastRelease.major}.${lastRelease.minor}.${lastRelease.patch}`);
    });
}
exports.runAction = runAction;
