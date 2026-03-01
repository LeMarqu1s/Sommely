import { useMemo } from 'react';
import { getMemberCount, formatMemberCount } from '../lib/memberCount';

export function useMemberCount(): string {
  return useMemo(() => formatMemberCount(getMemberCount()), []);
}
