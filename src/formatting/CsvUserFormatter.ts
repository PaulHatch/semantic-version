import { ActionConfig } from "../ActionConfig.js";
import { UserInfo } from "../providers/UserInfo.js";
import { UserFormatter } from "./UserFormatter.js";

export class CsvUserFormatter implements UserFormatter {
  constructor(config: ActionConfig) {
    // placeholder for consistency with other formatters
  }

  public Format(type: string, users: UserInfo[]): string {
    return users.map((user) => `${user.name} <${user.email}>`).join(", ");
  }
}
