import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { KeyRound, Fingerprint, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { Button } from '../../src/components/ui/button';
import { Card, CardContent } from '../../src/components/ui/card';
import { saveQuickPin, setBiometricEnabled } from '../../src/data/security/secureStorage';
import { useBiometricLock } from '../../src/presentation/context/BiometricLockContext';
import { theme } from '../../src/theme';

export default function PinSetupScreen() {
  const router = useRouter();
  const { refreshPinStatus } = useBiometricLock();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    setErrorMsg(null);
    if (step === 'create') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => setStep('confirm'), 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            completeSetup(next);
          } else {
            setErrorMsg('PINs do not match. Please re-enter.');
            setConfirmPin('');
            setStep('create');
            setPin('');
          }
        }
      }
    }
  };

  const completeSetup = async (finalPin: string) => {
    await saveQuickPin(finalPin);
    await setBiometricEnabled(true);
    await refreshPinStatus();
    router.replace('/(protected)');
  };

  const currentVal = step === 'create' ? pin : confirmPin;

  return (
    <ScreenWrapper withTopInset>
      <View className="items-center pt-8 pb-6">
        <View className="h-14 w-14 rounded-full bg-primary-light items-center justify-center mb-3">
          <KeyRound size={28} color={theme.colors.primary.DEFAULT} />
        </View>
        <Text className="text-xl font-bold text-text-primary text-center">
          {step === 'create' ? 'Set Point-of-Care Quick PIN' : 'Confirm Your Quick PIN'}
        </Text>
        <Text className="text-sm text-text-secondary text-center mt-1 px-4">
          For rapid, secure unlocking between resident rooms compliant with CQC DSPT guidelines.
        </Text>

        {/* 4 dots */}
        <View className="flex-row gap-4 my-6">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`h-4 w-4 rounded-full border-2 border-primary ${
                currentVal.length > i ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </View>

        {errorMsg && (
          <Text className="text-xs font-semibold text-clinical-critical mb-3">{errorMsg}</Text>
        )}
      </View>

      <Card className="max-w-[290px] w-full self-center p-3">
        <CardContent className="gap-3 p-2">
          <View className="flex-row justify-between">
            {['1', '2', '3'].map((d) => (
              <PinButton key={d} digit={d} onPress={() => handleDigit(d)} />
            ))}
          </View>
          <View className="flex-row justify-between">
            {['4', '5', '6'].map((d) => (
              <PinButton key={d} digit={d} onPress={() => handleDigit(d)} />
            ))}
          </View>
          <View className="flex-row justify-between">
            {['7', '8', '9'].map((d) => (
              <PinButton key={d} digit={d} onPress={() => handleDigit(d)} />
            ))}
          </View>
          <View className="flex-row justify-between items-center">
            <View className="h-14 w-14 items-center justify-center">
              <Fingerprint size={24} color={theme.colors.primary.DEFAULT} />
            </View>
            <PinButton digit="0" onPress={() => handleDigit('0')} />
            <TouchableOpacity
              onPress={() => {
                if (step === 'create') setPin(pin.slice(0, -1));
                else setConfirmPin(confirmPin.slice(0, -1));
              }}
              className="h-14 w-14 items-center justify-center rounded-full bg-white"
            >
              <Text className="text-xs font-bold text-text-primary">DEL</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </ScreenWrapper>
  );
}

function PinButton({ digit, onPress }: { digit: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="h-14 w-14 rounded-full bg-white items-center justify-center active:bg-primary/20"
    >
      <Text className="text-xl font-bold text-text-primary">{digit}</Text>
    </TouchableOpacity>
  );
}
