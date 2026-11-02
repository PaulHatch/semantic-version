import { ActionConfig } from "../ActionConfig.js";
import { UserInfo } from "../providers/UserInfo.js";
import { UserFormatter } from "./UserFormatter.js";

export class JsonUserFormatter implements UserFormatter {
  constructor(config: ActionConfig) {
    // placeholder for consistency with other formatters
  }
  public Format(type: string, users: UserInfo[]): string {
    let result: any = users.map((u) => ({ name: u.name, email: u.email }));
    return JSON.stringify(result).replace("\n", "");
  }
}
