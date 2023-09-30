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
exports.DefaultCurrentCommitResolver = void 0;
const CommandRunner_1 = require("../CommandRunner");
class DefaultCurrentCommitResolver {
    constructor(config) {
        this.branch = config.branch;
    }
    ResolveAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.branch === 'HEAD') {
                return (yield (0, CommandRunner_1.cmd)('git', 'rev-parse', 'HEAD')).trim();
            }
            return this.branch;
        });
    }
    IsEmptyRepoAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let lastCommitAll = (yield (0, CommandRunner_1.cmd)('git', 'rev-list', '-n1', '--all')).trim();
            return lastCommitAll === '';
        });
    }
    ResolveBranchNameAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const branchName = this.branch == 'HEAD' ?
                process.env.GITHUB_REF_NAME || (yield (0, CommandRunner_1.cmd)('git', 'branch', '--show-current'))
                : this.branch;
            return branchName.trim();
        });
    }
}
exports.DefaultCurrentCommitResolver = DefaultCurrentCommitResolver;
