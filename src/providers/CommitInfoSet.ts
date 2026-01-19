import { CommitInfo } from "./CommitInfo";

/** Represents information about a set of commits */
export class CommitInfoSet {
  constructor(
    public changed: boolean,
    public commits: CommitInfo[],
  ) {}
}
