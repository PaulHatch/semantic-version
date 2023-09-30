import { ActionConfig } from "../ActionConfig";
import { cmd } from "../CommandRunner";
import { CurrentCommitResolver } from "./CurrentCommitResolver";


export class DefaultCurrentCommitResolver implements CurrentCommitResolver {

    private branch: string;

    constructor(config: ActionConfig) {
        this.branch = config.branch;
    }

    public async ResolveAsync(): Promise<string> {
        if (this.branch === 'HEAD') {
            return (await cmd('git', 'rev-parse', 'HEAD')).trim();
        }
        return this.branch;
    }

    public async IsEmptyRepoAsync(): Promise<boolean> {
        let lastCommitAll = (await cmd('git', 'rev-list', '-n1', '--all')).trim();
        return lastCommitAll === '';
    }

    public async ResolveBranchNameAsync(): Promise<string> {
        const branchName =
            this.branch == 'HEAD' ? await cmd('git', 'rev-parse', '--abbrev-ref', 'HEAD') : this.branch;


        return branchName.trim();
    }
}