import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, View, type AlertButton, type AlertOptions } from 'react-native';
import { Button, Card, Text } from './index';

interface AlertRequest {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

/** React Native Web's Alert.alert is a no-op; render the existing application primitives. */
export function WebAlertProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<AlertRequest[]>([]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const original = Alert.alert;
    const show: typeof Alert.alert = (title, message, buttons, options) => {
      setRequests((previous) => [
        ...previous,
        { title: title ?? '', message: message ?? undefined, buttons, options },
      ]);
    };
    Alert.alert = show;
    return () => {
      if (Alert.alert === show) Alert.alert = original;
    };
  }, []);

  const request = requests[0];
  const dismiss = () => {
    if (request?.options?.cancelable === false) return;
    setRequests((previous) => previous.slice(1));
    request?.options?.onDismiss?.();
  };
  return (
    <>
      {children}
      {Platform.OS === 'web' && request && (
        <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
          <View className="flex-1 items-center justify-center bg-black/60 p-6">
            <Card
              accessibilityRole="alert"
              className="w-full max-w-lg bg-white rounded-2xl p-6 gap-4"
            >
              <Text className="text-lg font-bold text-foreground">{request.title}</Text>
              {request.message && (
                <Text className="text-base text-muted-foreground">{request.message}</Text>
              )}
              <View className="flex-row flex-wrap justify-end gap-3">
                {(request.buttons?.length ? request.buttons : [{ text: 'OK' }]).map(
                  (button, index) => (
                    <Button
                      key={index}
                      variant={
                        button.style === 'destructive'
                          ? 'destructive'
                          : button.style === 'cancel'
                            ? 'outline'
                            : 'default'
                      }
                      onPress={() => {
                        setRequests((previous) => previous.slice(1));
                        button.onPress?.();
                      }}
                    >
                      {button.text || 'OK'}
                    </Button>
                  ),
                )}
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </>
  );
}
