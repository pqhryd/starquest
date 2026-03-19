import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NFTShowcase from './NFTShowcase';
import { buyMysteryBox } from '../api';

const BOX_TIERS = [
  { cost: 10, label: 'Bronze Box', emoji: '🎁', color: 'from-amber-900 to-amber-700', glow: 'rgba(217,119,6,0.5)' },
  { cost: 25, label: 'Silver Box', emoji: '🎁', color: 'from-slate-600 to-slate-400', glow: 'rgba(148,163,184,0.5)' },
  { cost: 50, label: 'Gold Box', emoji: '🎁', color: 'from-yellow-700 to-yellow-500', glow: 'rgba(234,179,8,0.5)' },
];

export default function NFTMysteryBox({ user, showToast, reload }) {
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState(null);

  const buyBox = async (cost) => {
    if (opening) return;
    if ((user?.stars || 0) < cost) {
      showToast('⚠️ Недостаточно звёзд', 'err');
      return;
    }
    setOpening(true);
    try {
      const d = await buyMysteryBox(cost);
      if (d.ok) {
        setReward(d.reward);
        await reload();
        setTimeout(() => setReward(null), 4000);
      } else {
        showToast(d.error || 'Ошибка', 'err');
      }
    } catch (e) {
      showToast('Ошибка сети', 'err');
    }
    setOpening(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎁</span>
        <h3 className="font-display text-sm font-black">NFT Mystery Box</h3>
        <span className="text-[10px] text-sub font-bold bg-white/[0.06] px-2 py-0.5 rounded-full">NEW</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {BOX_TIERS.map((tier) => (
          <NFTShowcase key={tier.cost} glowColor={tier.glow}>
            <button
              onClick={() => buyBox(tier.cost)}
              disabled={opening}
              className="p-3 text-center w-full"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl mb-1.5"
              >
                {tier.emoji}
              </motion.div>
              <div className="text-[10px] font-bold text-white/60 mb-1">{tier.label}</div>
              <div className="font-display text-xs font-black text-gold">{tier.cost} ⭐</div>
            </button>
          </NFTShowcase>
        ))}
      </div>

      {/* Reward popup */}
      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-lg"
          >
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="bg-gradient-to-br from-acc to-neon-pink rounded-[28px] p-8 text-center w-72 relative overflow-hidden"
            >
              {/* Confetti */}
              {['#ffd166', '#ff6b9d', '#7c5cfc', '#06d6a0', '#3a86ff'].map((c, i) => (
                Array.from({ length: 5 }).map((_, j) => (
                  <div key={`${i}-${j}`}
                    className="absolute rounded-full"
                    style={{
                      width: 3 + Math.random() * 7,
                      height: 3 + Math.random() * 7,
                      background: c,
                      left: `${Math.random() * 100}%`,
                      animation: `confettiFall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.6}s both`,
                    }}
                  />
                ))
              ))}

              <div className="font-display text-lg font-black text-white relative z-10">НАГРАДА!</div>
              <div className="text-5xl my-4 relative z-10 drop-shadow-[0_8px_30px_rgba(255,209,102,0.7)]">⭐</div>
              <div className="font-display text-xl font-black text-white relative z-10">
                +{reward.amount} ЗВЁЗД
              </div>
              <button
                onClick={() => setReward(null)}
                className="mt-5 px-8 py-2.5 bg-white/20 border border-white/30 rounded-[14px] text-white
                  text-sm font-extrabold relative z-10"
              >
                Забрать!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
