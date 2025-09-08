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
exports.DefaultCommitsProvider = void 0;
const CommandRunner_1 = require("../CommandRunner");
const CommitInfo_1 = require("./CommitInfo");
const CommitInfoSet_1 = require("./CommitInfoSet");
const core = __importStar(require("@actions/core"));
class DefaultCommitsProvider {
    constructor(config) {
        this.changePath = config.changePath;
    }
    GetCommitsAsync(startHash, endHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const logSplitter = `@@@START_RECORD`;
            const formatPlaceholders = Object.entries({
                hash: '%H',
                subject: '%s',
                body: '%b',
                author: '%an',
                authorEmail: '%ae',
                authorDate: '%aI',
                committer: '%cn',
                committerEmail: '%ce',
                committerDate: '%cI',
                tags: '%d'
            });
            const pretty = logSplitter + '%n' + formatPlaceholders
                .map(x => `@@@${x[0]}%n${x[1]}`)
                .join('%n');
            var logCommand = `git log --pretty="${pretty}" --author-date-order ${(startHash === '' ? endHash : `${startHash}..${endHash}`)}`;
            if (this.changePath !== '') {
                core.info("VAGO Changepath was there: " + this.changePath);
                logCommand += ` -- ${this.changePath}`;
                core.info("VAGO logCommand: " + logCommand);
            }
            const log = yield (0, CommandRunner_1.cmd)(logCommand);
            const entries = log
                .split(logSplitter)
                .slice(1);
            const commits = entries.map(entry => {
                const fields = entry
                    .split(`@@@`)
                    .slice(1)
                    .reduce((acc, value) => {
                    const firstLine = value.indexOf('\n');
                    const key = value.substring(0, firstLine);
                    acc[key] = value.substring(firstLine + 1).trim();
                    return acc;
                }, {});
                const tags = fields.tags
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v.startsWith('tags: '))
                    .map((v) => v.substring(5).trim());
                return new CommitInfo_1.CommitInfo(fields.hash, fields.subject, fields.body, fields.author, fields.authorEmail, new Date(fields.authorDate), fields.committer, fields.committerEmail, new Date(fields.committerDate), tags);
            });
            // check for changes
            let changed = true;
            if (this.changePath !== '') {
                if (startHash === '') {
                    const changedFiles = yield (0, CommandRunner_1.cmd)(`git log --name-only --oneline ${endHash} -- ${this.changePath}`);
                    changed = changedFiles.length > 0;
                }
                else {
                    core.info("VAGO diffing: " + logCommand);
                    const changedFiles = yield (0, CommandRunner_1.cmd)(`git diff --name-only ${startHash}..${endHash} -- ${this.changePath}`);
                    changed = changedFiles.length > 0;
                    core.info("VAGO changedFiles le: " + changedFiles.length);
                }
            }
            return new CommitInfoSet_1.CommitInfoSet(changed, commits);
        });
    }
}
exports.DefaultCommitsProvider = DefaultCommitsProvider;
