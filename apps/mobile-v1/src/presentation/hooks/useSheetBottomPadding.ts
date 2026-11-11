import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for bottom sheets rendered inside a native <Modal>.
 * The app runs edge-to-edge on Android, so a Modal draws underneath the system
 * navigation bar (3-button or gesture) and any fixed padding can leave action
 * buttons hidden behind it. Adds the real inset on top of the sheet's own spacing.
 */
export function useSheetBottomPadding(basePadding = 16): number {
  const insets = useSafeAreaInsets();
  return basePadding + insets.bottom;
}
