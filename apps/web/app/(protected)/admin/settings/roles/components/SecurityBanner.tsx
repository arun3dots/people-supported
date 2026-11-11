import React from 'react';
import { LockKeyhole } from 'lucide-react';

interface SecurityBannerProps {
  onSecuritySettingsClick?: () => void;
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({
  onSecuritySettingsClick,
}) => {
  return (
    <div className="w-full min-h-[72px] bg-surface-card-grey rounded-2xl p-5 flex items-center justify-between gap-4 font-sans">
      {/* Left Content Section (Icon + Text) */}
      <div className="flex items-center gap-4">
        {/* Lock Icon */}
        <div className="size-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <LockKeyhole
            className="size-5 text-emerald-800"
            strokeWidth={1.75}
          />
        </div>

        {/* Text Container */}
        <div className="flex flex-col gap-0.5">
          {/* Title */}
          <h4 className="text-md font-semibold text-slate-900 m-0">
            Security is enabled
          </h4>

          {/* Subtitle */}
          <p className="text-md font-normal text-slate-500 m-0">
            All user accounts are protected according to your organisation’s security policy.
          </p>
        </div>
      </div>

      {/* Security Settings Button */}
      <button
        type="button"
        onClick={onSecuritySettingsClick}
        className="shrink-0 h-10 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
      >
        <span className="text-md font-medium text-slate-900 whitespace-nowrap">
          Security Settings
        </span>
      </button>
    </div>
  );
};

export default SecurityBanner;