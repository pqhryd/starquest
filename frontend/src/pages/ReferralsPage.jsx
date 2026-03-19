import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';

export default function ReferralsPage({ user, refLink, showToast }) {
  const { haptic, openLink } = useTelegram();
  const qr = user?.qualified_referrals || 0;
  const pct = Math.min(100, (qr / 15) * 100);
  const refList = user?.ref_list || [];

  const copyRef = () => {
    navigator.clipboard?.writeText(refLink).catch(() => {});
    showToast('✅ Ссылка скопирована!', 'ok');
    haptic.light();
  };

  const shareRef = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('⭐ Заходи в StarQuest — выполняй задания и зарабатывай звёзды!')}`;
    openLink(url);
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-3.5 py-2.5 flex flex-col gap-3">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] p-5 text-center relative overflow-hidden
          bg-gradient-to-br from-[#130830] via-[#240a5c] to-[#130840] border border-acc/20"
      >
        <div className="absolute -top-5 -left-5 w-20 h-20 opacity-[0.12] blur-sm rotate-[-15deg] text-6xl">🎁</div>
        <div className="absolute -top-5 -right-5 w-20 h-20 opacity-[0.12] blur-sm rotate-[15deg] text-6xl">🎁</div>
        <div className="relative z-[1]">
          <span className="text-[56px] block mb-3.5 drop-shadow-[0_4px_16px_rgba(124,92,252,0.5)]">👥</span>
          <h2 className="font-display text-lg font-black mb-2">Реферальная программа</h2>
          <p className="text-xs text-white/55 leading-[1.8] font-medium">
            Приглашай друзей — получай <b className="text-white">+1 ⭐ за каждого</b>.
            Набери <b className="text-white">15 квал. рефералов</b> и разблокируй вывод!
          </p>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="bg-s1 border border-white/[0.04] rounded-[20px] p-4">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-extrabold">Квалифицированных рефералов</span>
          <span className="font-display text-sm font-black text-acc2">{qr}/15</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, type: 'spring' }}
            className="h-full bg-gradient-to-r from-acc to-neon-pink rounded-full progress-fill"
          />
        </div>
        <p className="text-[10px] text-sub font-semibold mt-2">
          {qr >= 15 ? '🎉 Вывод разблокирован!' : `Нужно ещё ${15 - qr} рефералов`}
        </p>
      </motion.div>

      {/* Link */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="bg-s1 border border-white/[0.04] rounded-[20px] p-4">
        <div className="text-[10px] text-sub uppercase tracking-[0.1em] font-bold mb-2">Реферальная ссылка</div>
        <div onClick={copyRef}
          className="bg-white/[0.04] border border-white/[0.04] rounded-xl py-2.5 px-3.5 flex items-center gap-2.5
            cursor-pointer active:bg-white/[0.1] transition-colors">
          <span className="flex-1 text-xs text-acc2 font-semibold font-mono truncate">{refLink}</span>
          <span className="text-lg">📋</span>
        </div>
      </motion.div>

      {/* Share button */}
      <motion.button
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
        onClick={shareRef}
        className="w-full py-3.5 bg-gradient-to-br from-acc to-neon-pink rounded-[16px] text-white
          text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_6px_24px_rgba(124,92,252,0.45)]
          active:scale-[0.97] transition-transform"
      >
        ✈️ Поделиться в Telegram
      </motion.button>

      {/* Referral list */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <div className="text-[13px] font-extrabold mb-2.5">Список рефералов</div>
        {refList.length > 0 ? (
          <div className="flex flex-col gap-2">
            {refList.map((r) => (
              <div key={r.id} className="bg-s1 border border-white/[0.04] rounded-[16px] p-3 px-3.5
                flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-acc to-neon-pink
                  flex items-center justify-center text-[15px] font-black shrink-0
                  shadow-[0_4px_12px_rgba(124,92,252,0.4)]">
                  {(r.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">{r.name || 'Пользователь'}</div>
                  <div className="text-[10px] text-sub mt-0.5 font-medium">
                    {r.qualified ? `✓ Выполнил ${r.tasks} задан.` : 'Ещё не выполнил'}
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shrink-0
                  ${r.qualified
                    ? 'bg-neon-green/[0.12] text-neon-green border border-neon-green/25'
                    : 'bg-white/[0.05] text-sub border border-white/[0.04]'}`}>
                  {r.qualified ? '✓ Засчитан' : '⏳ Ожидание'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-7 text-sub text-[13px] leading-[2]">
            🙈<br />Пока никого нет.<br />Поделись ссылкой!
          </div>
        )}
      </motion.div>
    </div>
  );
}
