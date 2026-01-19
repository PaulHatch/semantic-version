import { ActionConfig } from "../ActionConfig";
import { cmd } from "../CommandRunner";
import { CommitInfo } from "./CommitInfo";
import { CommitInfoSet } from "./CommitInfoSet";
import { CommitsProvider } from "./CommitsProvider";

export class DefaultCommitsProvider implements CommitsProvider {
  private changePath: string;

  constructor(config: ActionConfig) {
    this.changePath = config.changePath;
  }

  async GetCommitsAsync(
    startHash: string,
    endHash: string,
  ): Promise<CommitInfoSet> {
    const logSplitter = `@@@START_RECORD`;
    const formatPlaceholders = Object.entries({
      hash: "%H",
      subject: "%s",
      body: "%b",
      author: "%an",
      authorEmail: "%ae",
      authorDate: "%aI",
      committer: "%cn",
      committerEmail: "%ce",
      committerDate: "%cI",
      tags: "%d",
    });

    const pretty =
      logSplitter +
      "%n" +
      formatPlaceholders.map((x) => `@@@${x[0]}%n${x[1]}`).join("%n");

    var logCommand = `git log --pretty="${pretty}" --author-date-order ${startHash === "" ? endHash : `${startHash}..${endHash}`}`;

    if (this.changePath !== "") {
      logCommand += ` -- ${this.changePath}`;
    }

    const log = await cmd(logCommand);

    const entries = log.split(logSplitter).slice(1);

    const commits = entries.map((entry) => {
      const fields: any = entry
        .split(`@@@`)
        .slice(1)
        .reduce((acc: any, value: string) => {
          const firstLine = value.indexOf("\n");
          const key = value.substring(0, firstLine);
          acc[key] = value.substring(firstLine + 1).trim();
          return acc;
        }, {});

      const tags = fields.tags
        .split(",")
        .map((v: string) => v.trim())
        .filter((v: string) => v.startsWith("tags: "))
        .map((v: string) => v.substring(5).trim());

      return new CommitInfo(
        fields.hash,
        fields.subject,
        fields.body,
        fields.author,
        fields.authorEmail,
        new Date(fields.authorDate),
        fields.committer,
        fields.committerEmail,
        new Date(fields.committerDate),
        tags,
      );
    });

    // check for changes

    let changed = true;
    if (this.changePath !== "") {
      if (startHash === "") {
        const changedFiles = await cmd(
          `git log --name-only --oneline ${endHash} -- ${this.changePath}`,
        );
        changed = changedFiles.length > 0;
      } else {
        const changedFiles = await cmd(
          `git diff --name-only ${startHash}..${endHash} -- ${this.changePath}`,
        );
        changed = changedFiles.length > 0;
      }
    }

    return new CommitInfoSet(changed, commits);
  }
}
