import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { submitWithdraw, fetchWithdrawals } from '../api';

function sd(v) { return (+v) % 1 !== 0 ? (+v).toFixed(1) : +v; }

export default function WithdrawPage({ user, showToast, reload }) {
  const canW = user?.can_withdraw;
  const stars = +(user?.stars || 0);
  const tasks = (user?.completed_tasks || []).length;
  const qr = +(user?.qualified_referrals || 0);
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');
  const [method, setMethod] = useState('stars');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchWithdrawals().then(d => {
      if (d.ok) setHistory(d.withdrawals || []);
    }).catch(() => {});
  }, []);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 50) { showToast('⚠️ Минимум 50 звёзд', 'err'); return; }
    if (amt > stars) { showToast('⚠️ Недостаточно звёзд', 'err'); return; }
    if (!wallet.trim()) { showToast('⚠️ Введи @username или TON адрес', 'err'); return; }
    setSubmitting(true);
    const d = await submitWithdraw(amt, wallet.trim(), method);
    if (d?.ok) {
      showToast('✅ Заявка отправлена!', 'ok');
      await reload();
      setAmount('');
      setWallet('');
      fetchWithdrawals().then(d2 => { if (d2.ok) setHistory(d2.withdrawals || []); });
    } else {
      showToast(d?.error || 'Ошибка', 'err');
    }
    setSubmitting(false);
  };

  const statusLabels = { pending: '⏳ Ожидает', approved: '✅ Одобрено', rejected: '❌ Отклонено' };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-3.5 py-2.5 flex flex-col gap-3">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[24px] p-5 text-center relative overflow-hidden
          ${canW
            ? 'bg-gradient-to-br from-[#001c10] to-[#003828] border border-neon-green/20'
            : 'bg-gradient-to-br from-[#1c0008] to-[#3a0018] border border-neon-red/20'}`}
      >
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[180px] h-[180px] rounded-full blur-[50px] opacity-20"
          style={{ background: canW ? '#06d6a0' : '#ef4565' }} />
        <span className="text-[50px] block mb-3 relative z-[1] drop-shadow-[0_6px_20px_rgba(255,255,255,0.2)]">
          {canW ? '💸' : '🔒'}
        </span>
        <h2 className="font-display text-[17px] font-black relative z-[1]">
          {canW ? 'Вывод доступен!' : 'Вывод заблокирован'}
        </h2>
        <p className="text-xs text-white/50 mt-2 leading-relaxed relative z-[1]">
          {canW ? 'Минимум 50 ⭐. Заявка отправится администраторам.' : 'Выполни оба условия для разблокировки.'}
        </p>
      </motion.div>

      {/* Requirements (locked state) */}
      {!canW && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="bg-s1 border border-white/[0.04] rounded-[20px] p-4">
          <div className="text-[13px] font-extrabold mb-3">Условия вывода</div>
          <div className="flex flex-col gap-2">
            <div className={`rounded-xl py-2.5 px-3.5 flex items-center gap-2.5 text-xs font-semibold
              ${tasks >= 1 ? 'text-neon-green' : 'text-sub'} bg-white/[0.04]`}>
              {tasks >= 1 ? '✅' : '⭕'} Хотя бы 1 задание{tasks >= 1 ? ' ✓' : ' (0/1)'}
            </div>
            <div className={`rounded-xl py-2.5 px-3.5 flex items-center gap-2.5 text-xs font-semibold
              ${qr >= 15 ? 'text-neon-green' : 'text-sub'} bg-white/[0.04]`}>
              {qr >= 15 ? '✅' : '⭕'} 15 квал. рефералов{qr >= 15 ? ' ✓' : ` (${qr}/15)`}
            </div>
          </div>
        </motion.div>
      )}

      {/* Withdraw form (unlocked state) */}
      {canW && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="bg-s1 border border-white/[0.04] rounded-[20px] p-4">

          {/* Method selector */}
          <div className="text-[10px] text-sub font-bold uppercase tracking-wide mb-1.5">Метод вывода</div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setMethod('stars')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                ${method === 'stars' ? 'bg-gradient-to-br from-acc to-neon-pink text-white' : 'bg-white/[0.06] text-sub'}`}>
              ⭐ Telegram Stars
            </button>
            <button onClick={() => setMethod('ton')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                ${method === 'ton' ? 'bg-gradient-to-br from-neon-blue to-acc text-white' : 'bg-white/[0.06] text-sub'}`}>
              💎 TON
            </button>
          </div>

          <div className="text-[10px] text-sub font-bold uppercase tracking-wide mb-1.5">
            Количество звёзд (мин. 50)
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Например: 50"
            min="50"
            max={stars}
            className="w-full bg-white/[0.04] border border-white/[0.04] rounded-xl py-3 px-3.5
              text-white text-sm font-semibold outline-none focus:border-acc focus:shadow-[0_0_0_3px_rgba(124,92,252,0.1)]
              transition-all mb-3 placeholder:text-sub"
          />
          <div className="flex justify-between items-center -mt-1 mb-3">
            <span className="text-[11px] text-sub">Доступно: {sd(stars)} ⭐</span>
            <button onClick={() => setAmount(String(stars))}
              className="text-[11px] text-acc2 font-extrabold bg-transparent border-none">Макс</button>
          </div>

          <div className="text-[10px] text-sub font-bold uppercase tracking-wide mb-1.5">
            {method === 'ton' ? 'TON кошелёк' : 'Telegram username'}
          </div>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder={method === 'ton' ? 'UQ...' : '@username'}
            className="w-full bg-white/[0.04] border border-white/[0.04] rounded-xl py-3 px-3.5
              text-white text-sm font-semibold outline-none focus:border-acc focus:shadow-[0_0_0_3px_rgba(124,92,252,0.1)]
              transition-all mb-3 placeholder:text-sub"
          />

          <button onClick={submit} disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-br from-neon-green to-[#00b8a9] rounded-[14px] text-white
              text-sm font-black shadow-[0_5px_20px_rgba(6,214,160,0.3)] active:scale-[0.97] transition-transform
              disabled:bg-white/[0.08] disabled:text-sub disabled:cursor-not-allowed disabled:shadow-none">
            {submitting ? '⏳ Отправляем...' : '💸 Отправить заявку'}
          </button>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="text-[13px] font-extrabold mb-2.5">История заявок</div>
          {history.map((w) => (
            <div key={w.id}
              className="bg-s1 border border-white/[0.04] rounded-[14px] py-3 px-3.5 flex items-center
                justify-between mb-2">
              <div>
                <div className="text-sm font-extrabold">⭐ {w.amount}</div>
                <div className="text-[10px] text-sub mt-0.5">{w.wallet}</div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg
                  ${w.status === 'pending' ? 'bg-gold/10 text-gold border border-gold/25' : ''}
                  ${w.status === 'approved' ? 'bg-neon-green/10 text-neon-green border border-neon-green/25' : ''}
                  ${w.status === 'rejected' ? 'bg-neon-red/10 text-neon-red border border-neon-red/25' : ''}`}>
                  {statusLabels[w.status] || w.status}
                </span>
                <div className="text-[9px] text-sub mt-1">{w.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
