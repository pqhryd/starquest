import { motion } from 'framer-motion';

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

const statCards = [
  { key: 'stars', icon: '⭐', label: 'Звёзд', bg: 'from-[#130830] to-[#240a5c]' },
  { key: 'tasks', icon: '✅', label: 'Заданий', bg: 'from-[#1c1000] to-[#3a2800]' },
  { key: 'refs',  icon: '👥', label: 'Рефералов', bg: 'from-[#001c10] to-[#003828]' },
  { key: 'level', icon: '🏆', label: 'Уровень', bg: 'from-[#001838] to-[#003278]' },
];

export default function StatsPage({ user }) {
  const stars = +(user?.stars || 0);
  const tasks = (user?.completed_tasks || []).length;
  const qr = +(user?.qualified_referrals || 0);
  const level = Math.floor(stars / 10) + 1;
  const pct = Math.min(100, Math.round((qr / 15) * 50 + (tasks >= 1 ? 50 : 0)));

  const values = { stars: sd(stars), tasks, refs: qr, level };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-3.5 py-2.5 flex flex-col gap-3">
      <h2 className="font-display text-[15px] font-black px-1 pt-1">📊 Статистика</h2>

      <div className="grid grid-cols-2 gap-2.5">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-[20px] p-4 text-center relative overflow-hidden
              border border-white/[0.05] bg-gradient-to-br ${s.bg}`}
          >
            <span className="text-[32px] block mb-2">{s.icon}</span>
            <div className="font-display text-2xl font-black">{values[s.key]}</div>
            <div className="text-[9px] text-white/35 font-bold uppercase tracking-wide mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-s1 border border-white/[0.04] rounded-[20px] p-4"
      >
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-extrabold">Прогресс до вывода</span>
          <span className="font-display text-sm font-black text-acc2">{pct}%</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, type: 'spring' }}
            className="h-full bg-gradient-to-r from-acc to-neon-pink rounded-full progress-fill"
          />
        </div>
        <p className="text-[10px] text-sub font-semibold mt-2">15 квал. рефералов + 1 задание</p>
      </motion.div>
    </div>
  );
}
