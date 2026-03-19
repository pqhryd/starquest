import { motion } from 'framer-motion';

export default function SplashScreen() {
  const stars = ['⭐','🌟','⭐','✨','🌟','⭐','✨'];
  const positions = [
    'top-[15%] left-[10%] text-sm',
    'top-[20%] right-[12%] text-[22px] opacity-70',
    'top-[60%] left-[8%] text-lg',
    'top-[70%] right-[10%] text-xs opacity-40',
    'top-[35%] left-[5%] text-base opacity-30',
    'bottom-[20%] left-[20%] text-xl opacity-60',
    'bottom-[25%] right-[18%] text-sm opacity-35',
  ];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-[9999] overflow-hidden"
    >
      {/* Floating stars */}
      {stars.map((s, i) => (
        <div key={i} className={`absolute animate-star-float ${positions[i]}`}
          style={{ animationDelay: `${i * 0.3}s` }}>{s}</div>
      ))}

      {/* Logo */}
      <div className="relative mb-5">
        <div className="absolute -inset-5 bg-gradient-radial from-acc/60 to-transparent rounded-full animate-glow-pulse" />
        <div className="text-7xl relative z-[1] drop-shadow-[0_0_30px_rgba(255,209,102,0.5)] animate-float">⭐</div>
      </div>

      <h1 className="font-display text-3xl font-black text-gradient mb-1.5">StarQuest</h1>
      <p className="text-[11px] text-sub tracking-[0.2em] uppercase font-semibold mb-8">
        Earn · Invite · Withdraw
      </p>

      {/* Spinner */}
      <div className="w-12 h-12 border-2 border-transparent border-t-acc border-r-neon-pink rounded-full animate-spin" />
    </motion.div>
  );
}
