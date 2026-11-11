import React from 'react';
import { View } from 'react-native';
import { Check, Dot } from 'lucide-react-native';
import { Text } from '../ui/text';

export interface PasswordCriteria {
  minChars: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  matches: boolean;
  isValid: boolean;
}

export function validatePasswordCriteria(newPass: string, confirmPass: string): PasswordCriteria {
  const minChars = newPass.length >= 12;
  const hasUpper = /[A-Z]/.test(newPass);
  const hasLower = /[a-z]/.test(newPass);
  const hasDigit = /[0-9]/.test(newPass);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPass);
  const matches = Boolean(newPass && newPass === confirmPass);
  const isValid = minChars && hasUpper && hasLower && hasDigit && hasSpecial && matches;

  return { minChars, hasUpper, hasLower, hasDigit, hasSpecial, matches, isValid };
}

interface PasswordRequirementsViewProps {
  newPassword: string;
  confirmPassword?: string;
  showMatchCriterion?: boolean;
}

export function PasswordRequirementsView({
  newPassword,
  confirmPassword = '',
  showMatchCriterion = true,
}: PasswordRequirementsViewProps) {
  const criteria = validatePasswordCriteria(newPassword, confirmPassword);

  const items = [
    { key: 'min', met: criteria.minChars, text: 'At least 12 characters' },
    { key: 'upper', met: criteria.hasUpper, text: 'At least one uppercase letter (A-Z)' },
    { key: 'lower', met: criteria.hasLower, text: 'At least one lowercase letter (a-z)' },
    { key: 'digit', met: criteria.hasDigit, text: 'At least one number (0-9)' },
    { key: 'special', met: criteria.hasSpecial, text: 'At least one special character (!@#$%...)' },
  ];

  if (showMatchCriterion && confirmPassword.length > 0) {
    items.push({
      key: 'match',
      met: criteria.matches,
      text: criteria.matches ? 'Passwords match' : 'Passwords do not match',
    });
  }

  return (
    <View className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 my-2 gap-1.5">
      <Text className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
        Password Requirements (NHS DSPT Standard)
      </Text>
      {items.map((item) => (
        <View key={item.key} className="flex-row items-center gap-1.5">
          {item.met ? (
            <View className="w-3.5 h-3.5 rounded-full bg-emerald-500 items-center justify-center">
              <Check size={10} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : (
            <View className="w-3.5 h-3.5 rounded-full bg-slate-200 items-center justify-center">
              <Dot size={12} color="#64748B" />
            </View>
          )}
          <Text
            className={`text-xs ${
              item.met ? 'text-emerald-700 font-semibold' : 'text-slate-500 font-normal'
            }`}
          >
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

