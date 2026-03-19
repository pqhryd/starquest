import { motion } from 'framer-motion';

const gradients = [
  'from-[#130830] via-[#240a5c] to-[#130840]',
  'from-[#001230] via-[#002060] to-[#001840]',
  'from-[#1a0800] via-[#3d1500] to-[#200500]',
  'from-[#001818] via-[#003838] to-[#001530]',
  'from-[#180018] via-[#380038] to-[#150025]',
];

const glowColors = ['bg-acc', 'bg-neon-blue', 'bg-gold', 'bg-neon-green', 'bg-neon-pink'];

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

export default function TaskCard({ channel, index, onCooldown, cooldownText, cooldownPct, onClick }) {
  const gradIdx = index % gradients.length;
  const glowIdx = index % glowColors.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onCooldown ? undefined : onClick}
      className={`rounded-[22px] overflow-hidden border border-white/[0.06]
        transition-transform active:scale-[0.97] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        relative ${onCooldown ? '' : 'cursor-pointer'}`}
    >
      {onCooldown && (
        <div className="absolute top-2.5 right-2.5 z-[3] w-6 h-6 bg-gold rounded-full
          flex items-center justify-center text-xs shadow-[0_0_14px_rgba(255,209,102,0.4)]">⏳</div>
      )}

      <div className={`p-4 relative overflow-hidden flex items-center gap-3.5 bg-gradient-to-br ${gradients[gradIdx]}`}>
        {/* Glow orb */}
        <div className={`absolute w-[150px] h-[150px] rounded-full opacity-[0.12] pointer-events-none z-0
          top-1/2 -left-10 -translate-y-1/2 blur-[40px] ${glowColors[glowIdx]}`} />

        {/* Channel avatar */}
        <div className="w-[52px] h-[52px] min-w-[52px] rounded-full overflow-hidden relative z-[2]
          bg-s3 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <img
            src={`https://t.me/i/userpic/320/${channel.username}.jpg`}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[22px] bg-gradient-to-br from-acc to-neon-pink rounded-full">📢</div>';
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 relative z-[2]">
          <div className="text-sm font-extrabold truncate max-w-[140px]">{channel.title}</div>
          <div className="text-[11px] text-white/35 mt-0.5 font-medium">@{channel.username}</div>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-gold/[0.08] border border-gold/[0.18]
            rounded-[20px] px-3 py-1">
            <span className="text-[13px]">⭐</span>
            <span className="font-display text-[13px] font-black text-gold">+{sd(channel.stars)}</span>
          </div>
        </div>

        {/* Right button */}
        <div className="relative z-[2] flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); if (!onCooldown) onClick?.(); }}
            className={`font-extrabold text-xs px-4 py-2.5 rounded-[20px] whitespace-nowrap transition-all active:scale-90
              ${onCooldown
                ? 'bg-white/[0.06] border border-white/[0.08] text-sub cursor-default text-[11px]'
                : 'bg-gradient-to-br from-acc to-neon-pink text-white shadow-[0_4px_14px_rgba(124,92,252,0.4)]'}`}
          >
            {onCooldown ? `⏳ ${cooldownText}` : 'Получить →'}
          </button>
          {onCooldown && (
            <div className="w-[72px] h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-acc to-neon-pink rounded-full"
                style={{ width: `${cooldownPct}%` }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
