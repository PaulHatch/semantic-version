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
exports.DefaultLastReleaseResolver = void 0;
const CommandRunner_1 = require("../CommandRunner");
const ReleaseInformation_1 = require("./ReleaseInformation");
const core = __importStar(require("@actions/core"));
class DefaultLastReleaseResolver {
    constructor(config) {
        this.changePath = config.changePath;
        this.useBranches = config.useBranches;
    }
    ResolveAsync(current, tagFormatter) {
        return __awaiter(this, void 0, void 0, function* () {
            const releasePattern = tagFormatter.GetPattern();
            let currentTag = (yield (0, CommandRunner_1.cmd)(`git tag --points-at ${current} ${releasePattern}`)).trim();
            const [currentMajor, currentMinor, currentPatch] = !!currentTag ? tagFormatter.Parse(currentTag) : [null, null, null];
            let tag = '';
            try {
                const refPrefixPattern = this.useBranches ? 'refs/heads/' : 'refs/tags/';
                if (!!currentTag) {
                    // If we already have the current branch tagged, we are checking for the previous one
                    // so that we will have an accurate increment (assuming the new tag is the expected one)
                    const command = `git for-each-ref --count=2 --sort=-v:*refname --format=%(refname:short) --merged=${current} ${refPrefixPattern}${releasePattern}`;
                    tag = yield (0, CommandRunner_1.cmd)(command);
                    tag = tag.split('\n').at(-1) || '';
                }
                else {
                    const command = `git for-each-ref --count=1 --sort=-v:*refname --format=%(refname:short) --merged=${current} ${refPrefixPattern}${releasePattern}`;
                    tag = yield (0, CommandRunner_1.cmd)(command);
                }
                tag = tag.trim();
            }
            catch (err) {
                tag = '';
            }
            if (tag === '') {
                if ((yield (0, CommandRunner_1.cmd)('git', 'remote')) !== '') {
                    // Since there is no remote, we assume that there are no other tags to pull. In
                    // practice this isn't likely to happen, but it keeps the test output from being
                    // polluted with a bunch of warnings.
                    core.warning('No tags are present for this repository. If this is unexpected, check to ensure that tags have been pulled from the remote.');
                }
                // no release tags yet, use the initial commit as the root
                return new ReleaseInformation_1.ReleaseInformation(0, 0, 0, '', currentMajor, currentMinor, currentPatch);
            }
            // parse the version tag
            const [major, minor, patch] = tagFormatter.Parse(tag);
            const root = yield (0, CommandRunner_1.cmd)('git', `merge-base`, tag, current);
            return new ReleaseInformation_1.ReleaseInformation(major, minor, patch, root.trim(), currentMajor, currentMinor, currentPatch);
        });
    }
}
exports.DefaultLastReleaseResolver = DefaultLastReleaseResolver;
