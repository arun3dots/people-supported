import { supportPlanLabel } from '../../lib/supportPlanLabel';

export interface MyProfileData {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  mfaEnabled: boolean;
  emailVerified: boolean;
  role: { id: string; name: string } | null;
  dob?: string | null;
  department: string | null;
  preferredLanguage: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  passwordChangedAt: string | null;
}

export interface ProfileAuditItem {
  id: string;
  actionType: string;
  timestamp: string;
  ipAddress?: string | null;
  os?: string;
  browser?: string;
  device?: string;
}

export function formatPasswordAge(passwordChangedAt: string | null | undefined): string {
  if (!passwordChangedAt) return 'Never changed';
  const changedDate = new Date(passwordChangedAt);
  if (isNaN(changedDate.getTime())) return 'Recently';

  const diffMs = Date.now() - changedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Changed today';
  if (diffDays === 1) return 'Changed 1 day ago';
  if (diffDays < 30) return `Changed ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Changed 1 month ago';
  return `Changed ${diffMonths} months ago`;
}

export function formatAuditActionTitle(actionType: string): string {
  const map: Record<string, string> = {
    LOGIN: 'Logged In',
    LOGOUT: 'Logged Out',
    FAILED_LOGIN: 'Failed Login Attempt',
    SELF_PROFILE_UPDATED: 'Profile Updated',
    PASSWORD_CHANGED: 'Password Changed',
    PASSWORD_RESET: 'Password Reset',
    MFA_ENABLED: 'MFA Enabled',
    MFA_DISABLED: 'MFA Disabled',
  };
  if (map[actionType]) return map[actionType];

  return supportPlanLabel(
    actionType
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' '),
  );
}

