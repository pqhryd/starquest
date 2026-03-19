import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { checkTask } from '../api';

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

export default function TaskModal({ channel, onClose, showToast, reload }) {
  const { tg, haptic } = useTelegram();
  const [subClicked, setSubClicked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [canCheck, setCanCheck] = useState(false);

  if (!channel) return null;

  const openChannel = () => {
    const url = `https://t.me/${channel.username}`;
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
    setSubClicked(true);
    setTimeout(() => setCanCheck(true), 3000);
  };

  const doCheck = async () => {
    if (checking) return;
    setChecking(true);
    const d = await checkTask(channel.id);
    if (d?.ok) {
      if (d.cooldown) { showToast(`⏳ КД: ${d.remaining_text}`, 'info'); onClose(); return; }
      if (d.subscribed) {
        await reload();
        showToast(`🎉 +${sd(d.stars_earned)} звёзд!`, 'ok');
        haptic.success();
        onClose();
        return;
      } else {
        showToast('❌ Подписка не найдена!', 'err');
        haptic.error();
      }
    } else {
      showToast(d?.error || 'Ошибка', 'err');
    }
    setChecking(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[400]
          flex items-end justify-center"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-s1 rounded-t-[30px] p-5 pb-9 w-full max-w-[480px]
            border-t border-white/[0.07] relative overflow-hidden"
        >
          {/* Decorative bg */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.06] text-[120px] pointer-events-none">🎁</div>

          {/* Handle */}
          <div className="w-[38px] h-1 bg-white/[0.12] rounded-full mx-auto mb-5" />

          <h2 className="font-display text-[17px] font-black text-center mb-1">Выполнить задание</h2>
          <p className="text-xs text-sub text-center mb-5">Подпишись на канал и получи звёзды</p>

          {/* Channel info */}
          <div className="flex items-center gap-3.5 mb-4 p-3.5 bg-white/[0.04] rounded-[18px]
            border border-white/[0.06] relative z-[1]">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-s3 shrink-0 shadow-[0_6px_20px_rgba(124,92,252,0.4)]">
              <img
                src={`https://t.me/i/userpic/320/${channel.username}.jpg`}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-acc to-neon-pink rounded-full">📢</div>'; }}
              />
            </div>
            <div>
              <div className="text-sm font-extrabold">{channel.title}</div>
              <div className="text-xs text-gold font-bold mt-0.5">+{sd(channel.stars)} ⭐</div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2 mb-4 relative z-[1]">
            {['Нажми кнопку и перейди на канал', 'Подпишись на канал', 'Вернись и нажми «Проверить»'].map((s, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-2.5 px-3.5 flex items-center gap-2.5
                text-xs font-semibold border border-white/[0.05]">
                <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-acc to-neon-pink
                  flex items-center justify-center text-[11px] font-black shrink-0
                  shadow-[0_2px_8px_rgba(124,92,252,0.5)]">{i + 1}</div>
                {s}
              </div>
            ))}
          </div>

          {/* Actions */}
          <button onClick={openChannel}
            className="w-full py-3.5 bg-gradient-to-br from-acc to-neon-pink rounded-[15px] text-white
              text-sm font-extrabold mb-2.5 shadow-[0_6px_22px_rgba(124,92,252,0.45)] active:scale-[0.97]
              transition-transform relative z-[1]">
            📲 Перейти на канал
          </button>

          <div className={`text-[11px] text-center mb-2.5 font-semibold py-2 px-3.5 rounded-[11px] relative z-[1]
            ${subClicked ? 'text-gold bg-gold/[0.06] border border-gold/[0.15]' : 'text-sub bg-white/[0.04]'}`}>
            {subClicked ? '✅ Подпишись и возвращайся!' : '⚠️ Сначала перейди на канал и подпишись'}
          </div>

          <button onClick={doCheck} disabled={!canCheck || checking}
            className="w-full py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-[15px] text-white
              text-[13px] font-bold mb-2 transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed
              relative z-[1]">
            {checking ? '⏳ Проверяем...' : '✅ Проверить подписку'}
          </button>

          <button onClick={onClose}
            className="w-full py-2.5 text-sub text-xs bg-transparent border-none relative z-[1]">
            Закрыть
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
