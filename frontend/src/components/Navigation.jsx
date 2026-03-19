const tabs = [
  { icon: '🎯', label: 'Задания' },
  { icon: '👥', label: 'Рефералы' },
  { icon: '📊', label: 'Статистика' },
  { icon: '💸', label: 'Вывод' },
  { icon: '🎰', label: 'Колесо' },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="flex bg-s1 border-t border-white/[0.04] px-2.5 pt-2 pb-3 gap-1 shrink-0">
      {tabs.map((t, i) => (
        <button
          key={i}
          onClick={() => onTabChange(i)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-[14px] border-none
            transition-all duration-200 ${activeTab === i
              ? 'bg-gradient-to-br from-acc/[0.12] to-neon-pink/[0.09]'
              : 'bg-transparent'}`}
        >
          <div className={`w-10 h-10 rounded-[13px] flex items-center justify-center text-[19px]
            transition-all duration-200 ${activeTab === i
              ? 'bg-gradient-to-br from-acc to-neon-pink shadow-[0_4px_18px_rgba(124,92,252,0.7)]'
              : 'bg-white/[0.04]'}`}>
            {t.icon}
          </div>
          <span className={`text-[9px] font-bold tracking-wide transition-colors
            ${activeTab === i ? 'text-white' : 'text-sub'}`}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
