import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ScreenWrapper, Text } from '../../presentation/components/common';

export function ResidentLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const router = useRouter();
  return (
    <ScreenWrapper scrollable>
      <View className="p-4 gap-4">
        <Text className="text-lg font-bold text-foreground">Unable to load person supported</Text>
        <Text className="text-base text-muted-foreground">{message}</Text>
        <Button onPress={onRetry}>Retry</Button>
        <Button variant="outline" onPress={() => router.navigate('/residents')}>
          People supported
        </Button>
      </View>
    </ScreenWrapper>
  );
}
