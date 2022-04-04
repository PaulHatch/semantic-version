import { TagFormatter } from '../formatting/TagFormatter';
import { ReleaseInformation } from './ReleaseInformation';

export interface LastReleaseResolver {
  ResolveAsync(current: string, tagFormatter: TagFormatter): Promise<ReleaseInformation>;
}
