import React, { useState } from 'react';
import { View, Modal, ActivityIndicator } from 'react-native';
import { Sparkles, RefreshCw, Clock, CheckCircle2 } from 'lucide-react-native';
import { useOTAUpdates } from '../../presentation/hooks/useOTAUpdates';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { theme } from '../../theme';

/**
 * Clinical-safe OTA update notification modal.
 * Notifies point-of-care staff when a new bundle is downloaded,
 * allowing immediate reload or deferral until the next shift cold start.
 */
export function OTAUpdateModal() {
  const {
    isPromptVisible,
    isUpdateReady,
    reloadToApplyUpdate,
    dismissUpdatePrompt,
  } = useOTAUpdates();

  const [isReloading, setIsReloading] = useState<boolean>(false);

  if (!isPromptVisible || !isUpdateReady) {
    return null;
  }

  const handleReload = async () => {
    try {
      setIsReloading(true);
      await reloadToApplyUpdate();
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Modal
      visible={isPromptVisible && isUpdateReady}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-950/80 items-center justify-center p-6">
        <View className="w-full max-w-sm rounded-md bg-card border border-border p-6">
          {/* Header Icon & Status Badge */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="h-12 w-12 rounded-md bg-primary/15 items-center justify-center border border-primary/25">
              <Sparkles size={24} color={theme.colors.primary.DEFAULT} />
            </View>
            <Badge variant="secondary" className="bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 size={12} color="#10b981" />
              <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                Downloaded
              </Text>
            </Badge>
          </View>

          {/* Title and Description */}
          <Text className="text-xl font-bold text-foreground mb-2">
            System Update Ready
          </Text>
          <Text className="text-sm text-muted-foreground leading-5 mb-4">
            A new version of CareHome Point-of-Care has downloaded in the background. It contains clinical workflow improvements and fixes.
          </Text>

          {/* Clinical Non-disruption Note */}
          <View className="rounded-md bg-muted/60 p-3 mb-6 border border-border/50 flex-row items-start gap-2.5">
            <Clock size={16} color={theme.colors.muted.foreground} className="mt-0.5" />
            <Text className="text-xs text-muted-foreground flex-1 leading-4">
              If you are actively documenting care, you can safely continue. This update will automatically apply the next time the app opens.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              onPress={handleReload}
              disabled={isReloading}
              className="w-full flex-row items-center justify-center gap-2"
            >
              {isReloading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <RefreshCw size={16} color="#ffffff" />
                  <Text className="text-white font-semibold text-sm">
                    Restart & Apply Now
                  </Text>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onPress={dismissUpdatePrompt}
              disabled={isReloading}
              className="w-full"
            >
              <Text className="text-foreground font-medium text-sm">
                Later (On Next Launch)
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
