import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import NFTMysteryBox from '../components/NFTMysteryBox';

export default function TasksPage({ user, channels, showToast, reload, setUser }) {
  const [modalChannel, setModalChannel] = useState(null);

  const completed = user?.completed_tasks || [];
  const cooldowns = user?.cooldowns || {};
  const now = Date.now();

  const getCooldown = (chId) => {
    const ts = cooldowns[String(chId)];
    if (!ts) return null;
    const rem = 86400000 - (now - new Date(ts).getTime());
    if (rem <= 0) return null;
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const pct = Math.round(((86400000 - rem) / 86400000) * 100);
    return { text: `${h}ч ${m}м`, pct };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-2.5 pb-1.5 flex items-center justify-between shrink-0">
        <h2 className="font-display text-[15px] font-black">🎯 Задания</h2>
        <span className="text-[11px] text-sub font-bold bg-s2 px-2.5 py-0.5 rounded-[20px]">
          {completed.length}/{channels.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-3.5 pb-5 flex flex-col gap-2.5">
        {channels.map((ch, i) => {
          const cd = getCooldown(ch.id);
          return (
            <TaskCard
              key={ch.id}
              channel={ch}
              index={i}
              onCooldown={!!cd}
              cooldownText={cd?.text}
              cooldownPct={cd?.pct}
              onClick={() => setModalChannel(ch)}
            />
          );
        })}

        {/* NFT Mystery Box section */}
        <div className="mt-4">
          <NFTMysteryBox user={user} showToast={showToast} reload={reload} />
        </div>
      </div>

      <AnimatePresence>
        {modalChannel && (
          <TaskModal
            channel={modalChannel}
            onClose={() => setModalChannel(null)}
            showToast={showToast}
            reload={reload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
