import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTelegram } from './hooks/useTelegram';
import { fetchUser } from './api';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import BalanceCard from './components/BalanceCard';
import Navigation from './components/Navigation';
import Toast from './components/Toast';
import TasksPage from './pages/TasksPage';
import ReferralsPage from './pages/ReferralsPage';
import StatsPage from './pages/StatsPage';
import WithdrawPage from './pages/WithdrawPage';
import WheelPage from './pages/WheelPage';
import LeaderboardPage from './pages/LeaderboardPage';

const BOT_USERNAME = 'starquesttbot';

export default function App() {
  const { tg, user: tgUser, haptic } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [toast, setToast] = useState(null);
  const [globalStats, setGlobalStats] = useState({ total_users: 0, total_tasks: 0 });

  // Init Telegram SDK
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    }
  }, [tg]);

  // Load user data
  const loadData = useCallback(async () => {
    try {
      const cached = localStorage.getItem(cacheKey());
      if (cached) {
        const c = JSON.parse(cached);
        if (c.user) { setUser(c.user); setChannels(c.channels || []); }
      }
      const d = await fetchUser();
      if (d.ok) {
        setUser(d.user);
        setChannels(d.channels || []);
        if (d.global_stats) setGlobalStats(d.global_stats);
        localStorage.setItem(cacheKey(), JSON.stringify({ user: d.user, channels: d.channels, global_stats: d.global_stats }));
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    loadData();
    return () => clearTimeout(timer);
  }, [loadData]);

  function cacheKey() {
    return tgUser?.id ? `sq_cache_${tgUser.id}` : 'sq_cache_guest';
  }

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const switchTab = (idx) => {
    setActiveTab(idx);
    haptic.select();
  };

  const refLink = user?.ref_link || `https://t.me/${BOT_USERNAME}?start=ref_${user?.id || 99999}`;

  const pages = [
    <TasksPage key="tasks" user={user} channels={channels} showToast={showToast}
      reload={loadData} setUser={setUser} />,
    <ReferralsPage key="refs" user={user} refLink={refLink} showToast={showToast} />,
    <StatsPage key="stats" user={user} globalStats={globalStats} />,
    <LeaderboardPage key="leaderboard" />,
    <WithdrawPage key="withdraw" user={user} showToast={showToast} reload={loadData} />,
    <WheelPage key="wheel" user={user} setUser={setUser} showToast={showToast} reload={loadData} />,
  ];

  return (
    <>
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="amb-orb w-[300px] h-[300px] bg-acc -top-20 -left-16" />
        <div className="amb-orb w-[250px] h-[250px] bg-neon-pink -bottom-16 -right-16" />
        <div className="amb-orb w-[200px] h-[200px] bg-neon-blue top-[40%] left-1/2 -translate-x-1/2" />
      </div>

      <AnimatePresence>{loading && <SplashScreen key="splash" />}</AnimatePresence>

      <div className="w-full max-w-[480px] h-[100dvh] mx-auto flex flex-col relative z-[1]">
        <Header user={user} tgUser={tgUser} />
        <BalanceCard user={user} onWithdraw={() => switchTab(3)} />

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar overscroll-none">
          {pages[activeTab]}
        </div>

        <Navigation activeTab={activeTab} onTabChange={switchTab} canWithdraw={user?.can_withdraw} />
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </>
  );
}
