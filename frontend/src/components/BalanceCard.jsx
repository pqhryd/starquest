import { motion } from 'framer-motion';

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

export default function BalanceCard({ user, onWithdraw }) {
  const stars = user?.stars || 0;
  const tasks = (user?.completed_tasks || []).length;
  const qr = user?.qualified_referrals || 0;
  const canW = user?.can_withdraw;

  return (
    <div className="mx-3.5 mt-1 rounded-[26px] overflow-hidden shrink-0">
      <div className="bg-gradient-to-br from-[#1a0e42] via-[#2d1268] to-[#1a0e4a] p-5 pb-4 relative overflow-hidden">
        {/* Decorative glow orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-acc/20 rounded-full blur-[60px]" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-neon-pink/15 rounded-full blur-[50px]" />

        <div className="relative z-[1] mb-3.5">
          <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.12em] mb-2">Ваш баланс</div>
          <div className="flex items-center gap-2.5">
            <span className="text-[34px] drop-shadow-[0_0_12px_rgba(255,209,102,0.5)]">⭐</span>
            <motion.span
              key={stars}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-[44px] font-black leading-none text-gradient-gold"
            >
              {sd(stars)}
            </motion.span>
          </div>
        </div>

        <div className="relative z-[1] flex items-center gap-2">
          <div className="flex-1 bg-white/[0.07] rounded-[14px] p-2.5 px-3 border border-white/[0.08]">
            <div className="text-lg font-black">{tasks}</div>
            <div className="text-[9px] text-white/40 uppercase tracking-wide font-bold mt-0.5">Заданий</div>
          </div>
          <div className="flex-1 bg-white/[0.07] rounded-[14px] p-2.5 px-3 border border-white/[0.08]">
            <div className="text-lg font-black">{qr}</div>
            <div className="text-[9px] text-white/40 uppercase tracking-wide font-bold mt-0.5">Рефералов</div>
          </div>
          <button
            onClick={onWithdraw}
            className={`font-black text-xs px-4 py-2.5 rounded-[14px] whitespace-nowrap transition-all active:scale-[0.92]
              ${canW
                ? 'bg-gradient-to-br from-gold to-gold2 text-[#1a0800] shadow-[0_4px_16px_rgba(255,209,102,0.25)]'
                : 'bg-white/[0.08] text-sub shadow-none'}`}
          >
            💸 Вывод
          </button>
        </div>
      </div>
    </div>
  );
}
