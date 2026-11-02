import { CsvUserFormatter } from "./formatting/CsvUserFormatter.js";
import { BranchVersioningTagFormatter } from "./formatting/BranchVersioningTagFormatter.js";
import { DefaultTagFormatter } from "./formatting/DefaultTagFormatter.js";
import { DefaultVersionFormatter } from "./formatting/DefaultVersionFormatter.js";
import { JsonUserFormatter } from "./formatting/JsonUserFormatter.js";
import { TagFormatter } from "./formatting/TagFormatter.js";
import { UserFormatter } from "./formatting/UserFormatter.js";
import { VersionFormatter } from "./formatting/VersionFormatter.js";
import { CommitsProvider } from "./providers/CommitsProvider.js";
import { CurrentCommitResolver } from "./providers/CurrentCommitResolver.js";
import { DefaultCommitsProvider } from "./providers/DefaultCommitsProvider.js";
import { DefaultCurrentCommitResolver } from "./providers/DefaultCurrentCommitResolver.js";
import { DefaultVersionClassifier } from "./providers/DefaultVersionClassifier.js";
import { LastReleaseResolver } from "./providers/LastReleaseResolver.js";
import { DefaultLastReleaseResolver } from "./providers/DefaultLastReleaseResolver.js";
import { VersionClassifier } from "./providers/VersionClassifier.js";
import { BumpAlwaysVersionClassifier } from "./providers/BumpAlwaysVersionClassifier.js";
import { ActionConfig } from "./ActionConfig.js";
import { DebugManager } from "./DebugManager.js";

export class ConfigurationProvider {
  constructor(config: ActionConfig) {
    this.config = config;
    DebugManager.getInstance().initializeConfig(config);
  }

  private config: ActionConfig;

  public GetCurrentCommitResolver(): CurrentCommitResolver {
    return new DefaultCurrentCommitResolver(this.config);
  }

  public GetLastReleaseResolver(): LastReleaseResolver {
    return new DefaultLastReleaseResolver(this.config);
  }

  public GetCommitsProvider(): CommitsProvider {
    return new DefaultCommitsProvider(this.config);
  }

  public GetVersionClassifier(): VersionClassifier {
    if (this.config.bumpEachCommit) {
      return new BumpAlwaysVersionClassifier(this.config);
    }
    return new DefaultVersionClassifier(this.config);
  }

  public GetVersionFormatter(): VersionFormatter {
    return new DefaultVersionFormatter(this.config);
  }

  public GetTagFormatter(branchName: string): TagFormatter {
    if (this.config.versionFromBranch) {
      return new BranchVersioningTagFormatter(this.config, branchName);
    }
    return new DefaultTagFormatter(this.config);
  }

  public GetUserFormatter(): UserFormatter {
    switch (this.config.userFormatType) {
      case "json":
        return new JsonUserFormatter(this.config);
      case "csv":
        return new CsvUserFormatter(this.config);
      default:
        throw new Error(
          `Unknown user format type: ${this.config.userFormatType}, supported types: json, csv`,
        );
    }
  }
}
