import { motion } from 'framer-motion';

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

const statCards = [
  { key: 'stars', icon: '⭐', label: 'Звёзд', bg: 'from-[#130830] to-[#240a5c]' },
  { key: 'tasks', icon: '✅', label: 'Заданий', bg: 'from-[#1c1000] to-[#3a2800]' },
  { key: 'refs',  icon: '👥', label: 'Рефералов', bg: 'from-[#001c10] to-[#003828]' },
  { key: 'level', icon: '🏆', label: 'Уровень', bg: 'from-[#001838] to-[#003278]' },
];

export default function StatsPage({ user, globalStats }) {
  const stars = +(user?.stars || 0);
  const tasks = (user?.completed_tasks || []).length;
  const qr = +(user?.qualified_referrals || 0);
  const level = Math.floor(stars / 10) + 1;
  const pct = Math.min(100, Math.round((qr / 15) * 50 + (tasks >= 1 ? 50 : 0)));

  const values = { stars: sd(stars), tasks, refs: qr, level };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-3.5 py-4 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xl">📊</span>
        <h2 className="font-display text-lg font-black tracking-tight">Статистика</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-[22px] p-5 text-center relative overflow-hidden group
              border border-white/[0.06] bg-gradient-to-br ${s.bg} shadow-lg`}
          >
            <div className="amb-orb w-12 h-12 bg-white/10 -top-4 -left-4 opacity-50 
              group-hover:scale-150 transition-transform duration-500" />
            <span className="text-3xl block mb-2 drop-shadow-md">{s.icon}</span>
            <div className="font-display text-2xl font-black text-white">{values[s.key]}</div>
            <div className="text-[10px] text-white/50 font-bold uppercase tracking-[0.1em] mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Global Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-s1/30 backdrop-blur-md border border-white/[0.05] rounded-[24px] overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
          <span className="text-[10px] font-black uppercase tracking-widest text-acc">Глобальные данные</span>
        </div>
        <div className="flex p-4 gap-4">
          <div className="flex-1 text-center">
            <div className="text-[10px] text-sub font-bold uppercase mb-1">Всего игроков</div>
            <div className="font-display text-xl font-black text-white">{globalStats?.total_users || 0}</div>
          </div>
          <div className="w-px h-10 bg-white/[0.05] self-center" />
          <div className="flex-1 text-center">
            <div className="text-[10px] text-sub font-bold uppercase mb-1">Заданий выполнено</div>
            <div className="font-display text-xl font-black text-neon-blue">{globalStats?.total_tasks || 0}</div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-s1/60 border border-white/[0.04] rounded-[24px] p-5"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-black uppercase tracking-tight text-white/70">Прогресс до вывода</span>
          <span className="font-display text-base font-black text-acc">{pct}%</span>
        </div>
        <div className="h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-acc via-neon-pink to-acc rounded-full relative"
          >
            <div className="absolute inset-0 bg-white/20 blur-[1px] rounded-full" />
          </motion.div>
        </div>
        <p className="text-[10px] text-sub font-semibold mt-3 flex items-center gap-1.5 opacity-60 italic">
          💡 Необходимо: 15 квал. рефералов и 1 задание
        </p>
      </motion.div>
    </div>
  );
}
