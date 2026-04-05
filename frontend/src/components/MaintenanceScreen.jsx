import { motion } from 'framer-motion';

export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-acc opacity-20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-pink opacity-20 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm glass-card p-10 text-center flex flex-col items-center"
      >
        <motion.div
            animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
            }}
            transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 mb-8 relative"
        >
            <div className="absolute inset-0 bg-acc opacity-30 blur-xl rounded-full" />
            <svg viewBox="0 0 24 24" className="w-full h-full fill-acc relative z-10">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.97 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.97 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
            </svg>
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
          Технические работы
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Проводим плановое обновление систем, чтобы StarQuest стал еще быстрее и лучше. 
          Загляните к нам чуть позже! 🚀
        </p>

        <div className="w-full h-[1px] bg-white/10 mb-6" />
        
        <div className="text-[10px] uppercase tracking-[0.2em] text-acc/60 font-medium">
          Status: Optimizing Systems
        </div>
      </motion.div>
    </div>
  );
}
