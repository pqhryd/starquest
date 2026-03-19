export default function Header({ user, tgUser }) {
  const name = user?.first_name || tgUser?.first_name || 'StarQuest';
  const avatarUrl = user?.photo_url || tgUser?.photo_url;
  const initial = (name || '?')[0].toUpperCase();

  return (
    <header className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-acc to-neon-pink
          flex items-center justify-center text-[17px] font-black shadow-[0_0_20px_rgba(124,92,252,0.5)]
          overflow-hidden shrink-0">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = initial; }} />
            : initial
          }
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold leading-tight">{name}</span>
          <span className="text-[10px] text-sub font-semibold tracking-wide">Участник программы</span>
        </div>
      </div>
      <div className="font-display text-[13px] font-black bg-gradient-to-r from-acc2 to-neon-pink
        bg-clip-text text-transparent">StarQuest</div>
    </header>
  );
}
