import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loginSchema, mfaVerifySchema } from '@repo/schema';
import { Input, Text } from '@/presentation/components/common';
import { useAuth } from '@/presentation/context/AuthContext';
import { useBiometricLock } from '@/presentation/context/BiometricLockContext';
import { AdminRedirectionModal } from '@/components/auth/AdminRedirectionModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { theme } from '@/theme/tokens';

const loginIllustration = require('../../assets/login_illustration.png');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const {
    loading,
    error,
    successToast,
    requiresMfa,
    adminPrompt,
    login,
    verifyMfa,
    dismissAdminPrompt,
  } = useAuth();
  const { isPinConfigured } = useBiometricLock();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (offset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }, 100);
  };

  const handleLogin = async () => {
    setValidationError(null);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message || 'Invalid credentials format');
      return;
    }

    const success = await login(parsed.data);
    if (success) {
      router.replace('/(protected)');
    }
  };

  const handleVerifyMfa = async () => {
    setValidationError(null);
    const parsed = mfaVerifySchema.safeParse({ token: mfaCode.trim() });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message || 'MFA code must be exactly 6 digits');
      return;
    }

    const success = await verifyMfa(parsed.data);
    if (success) {
      router.replace('/(protected)');
    }
  };

  const activeError = validationError || error;

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isKeyboardVisible ? 'flex-start' : 'center',
            paddingHorizontal: 24,
            paddingTop: isKeyboardVisible ? 12 : 20,
            paddingBottom: isKeyboardVisible ? 100 : 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[420px] self-center">
            {/* Header Title & Subtitle */}
            <View className="items-center mb-2">
              <Text className="text-2xl font-bold text-foreground text-center">
                Welcome Back!
              </Text>
              <Text className="text-base font-normal text-muted-foreground text-center mt-1">
                Sign in to continue
              </Text>
            </View>

            {/* Illustration */}
            <View
              className={`w-full items-center justify-center my-2 ${
                isKeyboardVisible ? 'h-[100px]' : 'h-[220px]'
              }`}
            >
              <Image
                source={loginIllustration}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>

            {/* Success Toast Banner */}
            {successToast && (
              <View className="flex-row items-center bg-clinical-safeBg rounded-2xl p-3.5 mb-3 gap-2">
                <CheckCircle2 size={18} color="#059669" />
                <Text className="text-xs font-semibold text-clinical-safe flex-1">
                  {successToast}
                </Text>
              </View>
            )}

            {/* Error Alert Banner */}
            {activeError && !adminPrompt && (
              <View className="flex-row items-center bg-clinical-criticalBg rounded-2xl p-3.5 mb-3 gap-2">
                <AlertCircle size={18} color="#FF3B2F" />
                <Text className="text-xs font-semibold text-clinical-critical flex-1">
                  {activeError}
                </Text>
              </View>
            )}

            {!requiresMfa ? (
              <View className="w-full mt-1">
                <Text className="text-xs font-semibold text-foreground mb-2">
                  Email Address
                </Text>
                <View
                  className={`h-[52px] w-full rounded-xl px-4 justify-center bg-surface border ${
                    emailFocused ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Input
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    importantForAutofill="yes"
                    keyboardAppearance="light"
                    onFocus={() => {
                      setEmailFocused(true);
                      scrollToInput(100);
                    }}
                    onBlur={() => setEmailFocused(false)}
                    style={{ color: theme.colors.foreground }}
                    className="h-full border-0 bg-transparent p-0 text-base text-foreground"
                  />
                </View>

                <Text className="text-xs font-semibold text-foreground mt-4 mb-2">
                  Password
                </Text>
                <View
                  className={`h-[52px] w-full rounded-xl bg-surface pl-4 pr-12 justify-center relative border ${
                    passwordFocused ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Input
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    importantForAutofill="yes"
                    keyboardAppearance="light"
                    onFocus={() => {
                      setPasswordFocused(true);
                      scrollToInput(170);
                    }}
                    onBlur={() => setPasswordFocused(false)}
                    style={{ color: theme.colors.foreground }}
                    className="h-full border-0 bg-transparent p-0 text-base text-foreground"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 p-1"
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#5D5D5D" />
                    ) : (
                      <Eye size={20} color="#5D5D5D" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  className="self-end mt-2.5 mb-5 py-1"
                  onPress={() => setShowForgotModal(true)}
                >
                  <Text className="text-xs font-bold text-primary">
                    Forget Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  disabled={loading || !email.trim() || !password}
                  className={`w-full h-[54px] rounded-full bg-primary items-center justify-center ${
                    loading || !email.trim() || !password ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-bold text-white">Log In</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-full mt-4">
                <Text className="text-xl font-bold text-foreground mb-1">
                  Two-Factor Authentication
                </Text>
                <Text className="text-xs text-muted-foreground mb-4">
                  Enter the 6-digit verification code from your authenticator app.
                </Text>

                <Text className="text-xs font-semibold text-foreground mb-2">
                  MFA Security Code
                </Text>
                <View className="h-[52px] w-full rounded-xl border border-primary bg-surface px-4 justify-center mb-4">
                  <Input
                    value={mfaCode}
                    onChangeText={(val) => {
                      setMfaCode(val);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="000 000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => scrollToInput(100)}
                    style={{ color: theme.colors.foreground }}
                    className="h-full border-0 bg-transparent p-0 text-lg font-bold text-center tracking-[6px] text-foreground"
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleVerifyMfa}
                  disabled={loading || mfaCode.trim().length !== 6}
                  className={`w-full h-[54px] rounded-full bg-primary items-center justify-center ${
                    loading || mfaCode.trim().length !== 6 ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-base font-bold text-white">Verify Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AdminRedirectionModal
        adminPrompt={adminPrompt}
        onDismiss={dismissAdminPrompt}
      />

      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
      />
    </View>
  );
}
