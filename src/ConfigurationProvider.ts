import { CsvUserFormatter } from './formatting/CsvUserFormatter'
import { DefaultTagFormatter } from './formatting/DefaultTagFormatter'
import { DefaultVersionFormatter } from './formatting/DefaultVersionFormatter'
import { JsonUserFormatter } from './formatting/JsonUserFormatter'
import { TagFormatter } from './formatting/TagFormatter'
import { UserFormatter } from './formatting/UserFormatter'
import { VersionFormatter } from './formatting/VersionFormatter'
import { CommitsProvider } from './providers/CommitsProvider'
import { CurrentCommitResolver } from './providers/CurrentCommitResolver'
import { DefaultCommitsProvider } from './providers/DefaultCommitsProvider'
import { DefaultCurrentCommitResolver } from './providers/DefaultCurrentCommitResolver'
import { DefaultVersionClassifier } from './providers/DefaultVersionClassifier'
import { LastReleaseResolver } from './providers/LastReleaseResolver'
import { DefaultLastReleaseResolver } from './providers/DefaultLastReleaseResolver'
import { VersionClassifier } from './providers/VersionClassifier'
import { BumpAlwaysVersionClassifier } from './providers/BumpAlwaysVersionClassifier'
import { ActionConfig } from './ActionConfig';

export class ConfigurationProvider {

  constructor(config: ActionConfig) {
    this.config = config;
  }

  private config: ActionConfig;

  public GetCurrentCommitResolver(): CurrentCommitResolver { return new DefaultCurrentCommitResolver(this.config); }

  public GetLastReleaseResolver(): LastReleaseResolver { return new DefaultLastReleaseResolver(this.config); }

  public GetCommitsProvider(): CommitsProvider { return new DefaultCommitsProvider(this.config); }

  public GetVersionClassifier(): VersionClassifier {
    if (this.config.bumpEachCommit) {
      return new BumpAlwaysVersionClassifier(this.config);
    }
    return new DefaultVersionClassifier(this.config);
  }

  public GetVersionFormatter(): VersionFormatter { return new DefaultVersionFormatter(this.config); }

  public GetTagFormatter(): TagFormatter { return new DefaultTagFormatter(this.config); }

  public GetUserFormatter(): UserFormatter {
    switch (this.config.userFormatType) {
      case 'json': return new JsonUserFormatter(this.config);
      case 'csv': return new CsvUserFormatter(this.config);
      default:
        throw new Error(`Unknown user format type: ${this.config.userFormatType}, supported types: json, csv`);
    }
  }
}
