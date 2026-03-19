import { useMemo } from 'react';

const tg = window.Telegram?.WebApp;

export function useTelegram() {
  const user = useMemo(() => tg?.initDataUnsafe?.user || null, []);
  const initData = useMemo(() => tg?.initData || '', []);

  const haptic = useMemo(() => ({
    light:   () => tg?.HapticFeedback?.impactOccurred('light'),
    medium:  () => tg?.HapticFeedback?.impactOccurred('medium'),
    heavy:   () => tg?.HapticFeedback?.impactOccurred('heavy'),
    success: () => tg?.HapticFeedback?.notificationOccurred('success'),
    error:   () => tg?.HapticFeedback?.notificationOccurred('error'),
    select:  () => tg?.HapticFeedback?.selectionChanged(),
  }), []);

  const openLink = (url) => {
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  };

  return { tg, user, initData, haptic, openLink };
}
