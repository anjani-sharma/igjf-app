import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlurTabBarBackground() {
  const { bottom } = useSafeAreaInsets();

  return (
    <BlurView
      tint="systemMaterial"
      intensity={100}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: -bottom,
        right: 0,
      }}
    />
  );
}

export function useBottomTabOverflow() {
  const { bottom } = useSafeAreaInsets();
  return bottom;
}