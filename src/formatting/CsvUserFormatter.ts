import { ActionConfig } from '../ActionConfig';
import { UserInfo } from '../providers/UserInfo';
import { UserFormatter } from './UserFormatter';

export class CsvUserFormatter implements UserFormatter {

  constructor(config: ActionConfig) {
    // placeholder for consistency with other formatters
  }

  public Format(type: string, users: UserInfo[]): string {
    return users.map(user => `${user.name} <${user.email}>`).join(', ');
  }
}
