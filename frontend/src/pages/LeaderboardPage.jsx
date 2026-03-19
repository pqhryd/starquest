import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLeaderboard } from '../api';

const tabs = [
  { id: 'stars', label: 'Звёзды', icon: '⭐' },
  { id: 'referrals', label: 'Рефы', icon: '👥' },
  { id: 'tasks', label: 'Задания', icon: '✅' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('stars');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLeaderboard(activeTab);
      if (res.ok) {
        setData(res.leaderboard);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-black mb-1">🏆 Доска Лидеров</h2>
        <p className="text-[10px] text-sub font-bold uppercase tracking-wider">Лучшие игроки StarQuest</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-s1/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/[0.04] sticky top-0 z-10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all relative
              ${activeTab === t.id ? 'text-white' : 'text-sub'}`}
          >
            {activeTab === t.id && (
              <motion.div
                layoutId="lb_tab"
                className="absolute inset-0 bg-gradient-to-r from-acc/80 to-neon-pink/80 rounded-xl"
              />
            )}
            <span className="relative z-10">{t.icon}</span>
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 mb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2"
            >
              {data.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border bg-s1/[0.4] backdrop-blur-sm
                    ${i === 0 ? 'border-gold/30 gold-glow' : 
                      i === 1 ? 'border-silver/30' : 
                      i === 2 ? 'border-bronze/30' : 'border-white/[0.04]'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-black
                    ${i === 0 ? 'bg-gold text-[#1a0800]' : 
                      i === 1 ? 'bg-silver text-[#1a1a1a]' : 
                      i === 2 ? 'bg-bronze text-[#1a0800]' : 'bg-white/5 text-sub'}`}>
                    {i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] truncate">{item.name}</div>
                    <div className="text-[10px] text-sub font-semibold">
                      {item.username ? `@${item.username}` : `ID: ${item.id}`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-sm font-black text-white">
                      {activeTab === 'stars' ? `${item.stars} ⭐` : 
                       activeTab === 'referrals' ? `${item.refs} 👥` : `${item.tasks} ✅`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
