import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Mail, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { FORGOT_PASSWORD, VERIFY_OTP, RESET_PASSWORD_OTP } from '@repo/endpoints';
import { forgotPasswordSchema, verifyOtpSchema, resetPasswordWithTokenSchema } from '@repo/schema';
import { Text } from '@/components/ui/text';
import { makeMobileApiCall } from '../../data/api/client';
import { theme } from '@/theme/tokens';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  initialEmail = '',
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep('email');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestOtp = async () => {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await makeMobileApiCall<{ success: boolean }>(FORGOT_PASSWORD, {
        email: email.trim(),
      });
      setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const parsed = verifyOtpSchema.safeParse({ email: email.trim(), otp: otp.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Verification code must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      const res = await makeMobileApiCall<{ success: boolean; resetToken: string }>(VERIFY_OTP, {
        email: email.trim(),
        otp: otp.trim(),
      });
      if (res?.resetToken) {
        setResetToken(res.resetToken);
        setStep('newPassword');
      } else {
        setError('Invalid reset token received from server');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired verification code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const parsed = resetPasswordWithTokenSchema.safeParse({
      resetToken,
      newPassword,
      email: email.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Password does not meet complexity requirements');
      return;
    }

    try {
      setLoading(true);
      await makeMobileApiCall<{ success: boolean }>(RESET_PASSWORD_OTP, {
        resetToken,
        newPassword,
        email: email.trim(),
      });
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-end sm:justify-center p-0 sm:p-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full max-w-lg self-center"
        >
          <View className="bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-100">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center">
                  <KeyRound size={20} color="#059669" />
                </View>
                <Text className="text-lg font-bold text-slate-800">Reset Password</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="p-1 rounded-full bg-slate-100"
                accessibilityLabel="Close reset password dialog"
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {error && (
              <View className="flex-row items-center bg-rose-50 border border-rose-200 rounded-lg p-3 mt-3 gap-2">
                <AlertCircle size={18} color="#E11D48" />
                <Text className="text-xs text-rose-700 flex-1">{error}</Text>
              </View>
            )}

            <ScrollView className="max-h-[460px] mt-4" keyboardShouldPersistTaps="handled">
              {/* Step 1: Request OTP */}
              {step === 'email' && (
                <View className="gap-3">
                  <Text className="text-sm text-slate-600">
                    Enter your staff email address. We will send a 6-digit verification code to reset your password.
                  </Text>
                  <View className="gap-1 mt-1">
                    <Text className="text-xs font-semibold text-slate-700">Email Address</Text>
                    <View className="h-12 flex-row items-center border border-slate-200 rounded-lg px-3 bg-white">
                      <Mail size={18} color="#94A3B8" />
                      <TextInput
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          setError(null);
                        }}
                        placeholder="carer@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: theme.fonts.regular }}
                        className="flex-1 ml-2 text-sm text-slate-800"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleRequestOtp}
                    disabled={loading || !email.trim()}
                    className={`h-12 bg-emerald-700 rounded-lg items-center justify-center mt-3 ${
                      loading || !email.trim() ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Send Verification Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Verify OTP */}
              {step === 'otp' && (
                <View className="gap-3">
                  <Text className="text-sm text-slate-600">
                    A 6-digit code was sent to <Text className="font-semibold text-slate-800">{email}</Text>. Please enter it below.
                  </Text>
                  <View className="gap-1 mt-1">
                    <Text className="text-xs font-semibold text-slate-700">6-Digit Code</Text>
                    <TextInput
                      value={otp}
                      onChangeText={(t) => {
                        setOtp(t);
                        setError(null);
                      }}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      style={{ fontFamily: theme.fonts.bold }}
                      className="h-12 border border-slate-200 rounded-lg px-3 text-center text-lg font-bold tracking-widest text-slate-800 bg-white"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={loading || otp.trim().length !== 6}
                    className={`h-12 bg-emerald-700 rounded-lg items-center justify-center mt-3 ${
                      loading || otp.trim().length !== 6 ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Verify Code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep('email')} className="items-center py-2">
                    <Text className="text-xs text-slate-500 font-medium">Resend or change email</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: New Password */}
              {step === 'newPassword' && (
                <View className="gap-3">
                  <Text className="text-sm text-slate-600">
                    Code verified. Enter your new secure password (minimum 8 characters with upper, lower, number, and special character).
                  </Text>
                  <View className="gap-1 mt-1">
                    <Text className="text-xs font-semibold text-slate-700">New Password</Text>
                    <View className="h-12 flex-row items-center border border-slate-200 rounded-lg px-3 bg-white">
                      <TextInput
                        value={newPassword}
                        onChangeText={(t) => {
                          setNewPassword(t);
                          setError(null);
                        }}
                        secureTextEntry={!showPassword}
                        placeholder="Enter new password"
                        style={{ fontFamily: theme.fonts.regular }}
                        className="flex-1 text-sm text-slate-800"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="gap-1 mt-1">
                    <Text className="text-xs font-semibold text-slate-700">Confirm New Password</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setError(null);
                      }}
                      secureTextEntry={!showPassword}
                      placeholder="Confirm new password"
                      style={{ fontFamily: theme.fonts.regular }}
                      className="h-12 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className={`h-12 bg-emerald-700 rounded-lg items-center justify-center mt-3 ${
                      loading || !newPassword || !confirmPassword ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <View className="items-center py-4 gap-3">
                  <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center">
                    <CheckCircle2 size={32} color="#059669" />
                  </View>
                  <Text className="text-base font-bold text-slate-800">Password Reset Successful</Text>
                  <Text className="text-xs text-slate-600 text-center px-4">
                    Your password has been securely updated. You can now log in with your new credentials.
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-full h-12 bg-emerald-700 rounded-lg items-center justify-center mt-2"
                  >
                    <Text className="text-sm font-semibold text-white">Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

