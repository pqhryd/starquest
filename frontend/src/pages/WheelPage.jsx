import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { spinWheel as apiSpin } from '../api';

const PRIZES = [
  { stars: 0.5,  label: '0.5 ⭐', color: '#1e1040', textColor: '#b39dfd', chance: 60 },
  { stars: 1,    label: '1 ⭐',   color: '#0e1840', textColor: '#90caf9', chance: 32 },
  { stars: 1.5,  label: '1.5 ⭐', color: '#1a1000', textColor: '#ffd166', chance: 5 },
  { stars: 2,    label: '2 ⭐',   color: '#0a2018', textColor: '#06d6a0', chance: 1.8 },
  { stars: 3,    label: '3 ⭐',   color: '#200820', textColor: '#ff6b9d', chance: 0.6 },
  { stars: 5,    label: '5 ⭐',   color: '#1a0800', textColor: '#ef8c3a', chance: 0.4 },
  { stars: 10,   label: '10 ⭐',  color: '#0a0820', textColor: '#ffd700', chance: 0.2 },
];

function lighten(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

export default function WheelPage({ user, setUser, showToast, reload }) {
  const { haptic } = useTelegram();
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldown, setCooldown] = useState(null);

  const drawWheel = useCallback((ang) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const cx = 150, cy = 150, r = 142;
    const seg = (Math.PI * 2) / PRIZES.length;
    ctx.clearRect(0, 0, 300, 300);

    // Outer glow ring
    const outerGlow = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 6);
    outerGlow.addColorStop(0, 'rgba(124,92,252,0.6)');
    outerGlow.addColorStop(1, 'rgba(124,92,252,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow; ctx.fill();

    PRIZES.forEach((p, i) => {
      const s = ang + i * seg - Math.PI / 2;
      const e = s + seg;
      const mid = s + seg / 2;

      // Segment with radial gradient
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e); ctx.closePath();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, lighten(p.color, 40));
      g.addColorStop(0.5, lighten(p.color, 20));
      g.addColorStop(1, p.color);
      ctx.fillStyle = g; ctx.fill();

      // Separator
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(s) * r, cy + Math.sin(s) * r);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();

      // Labels
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(mid);
      ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⭐', r * 0.72, 0);
      ctx.fillStyle = p.textColor || '#fff';
      ctx.shadowColor = 'rgba(0,0,0,1)'; ctx.shadowBlur = 6;
      ctx.font = 'bold 13px Unbounded, Inter, sans-serif';
      ctx.fillText(p.label, r * 0.38, 0);
      ctx.restore();
    });

    // Center hub
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    cg.addColorStop(0, '#8b6ffe'); cg.addColorStop(1, '#1a0e42');
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,209,102,0.8)'; ctx.shadowBlur = 10;
    ctx.fillText('⭐', cx, cy);
  }, []);

  // Init & cooldown check
  useEffect(() => {
    drawWheel(angleRef.current);
    checkCooldown();
    const inv = setInterval(checkCooldown, 10000);
    return () => clearInterval(inv);
  }, [drawWheel, user?.last_wheel_spin]);

  const checkCooldown = () => {
    if (!user?.last_wheel_spin) { setCooldown(null); return; }
    const last = new Date(user.last_wheel_spin).getTime();
    const rem = 86400000 - (Date.now() - last);
    if (rem <= 0) { setCooldown(null); return; }
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    setCooldown(`${h}ч ${m}м`);
  };

  const doSpin = async () => {
    if (spinning) return;
    const last = localStorage.getItem('sq_whl');
    if (last && Date.now() - +last < 86400000) {
      showToast('⏳ Приходи завтра!', 'info');
      return;
    }

    setSpinning(true);

    // Call API for server-side prize pick
    const apiResult = await apiSpin();
    const prizeIndex = apiResult?.ok ? apiResult.prize_index : 0;
    const prize = PRIZES[prizeIndex] || PRIZES[0];

    // Animate spin
    const seg = (Math.PI * 2) / PRIZES.length;
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    
    // Calculate target angle to land on segment center
    const currentRot = angleRef.current % (Math.PI * 2);
    const desiredRot = (Math.PI * 2) - (prizeIndex * seg + seg / 2);
    const diff = (desiredRot - currentRot + Math.PI * 2) % (Math.PI * 2);
    
    const target = angleRef.current + extraSpins + diff;
    const duration = 4500 + Math.random() * 1000;
    const t0 = performance.now();

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function frame(now) {
      const p = Math.min((now - t0) / duration, 1);
      const currentAngle = angleRef.current + (target - angleRef.current) * ease(p);
      drawWheel(currentAngle);

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        angleRef.current = target % (Math.PI * 2);
        setSpinning(false);

        // Update user stars locally
        if (apiResult?.ok && user) {
          setUser(prev => ({ ...prev, stars: apiResult.total_stars }));
        }

        localStorage.setItem('sq_whl', Date.now().toString());
        checkCooldown();
        setTimeout(() => {
          setResult(prize);
          haptic.success();
        }, 400);
      }
    }

    requestAnimationFrame(frame);
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4 flex flex-col items-center gap-3.5">
      {/* Title */}
      <div className="text-center w-full">
        <h2 className="font-display text-lg font-black mb-1.5">🎰 Колесо Фортуны</h2>
        <p className="text-xs text-sub font-semibold">Крути раз в 24 часа — выигрывай звёзды!</p>
      </div>

      {/* Wheel */}
      <div className="relative flex items-center justify-center w-[300px] h-[300px] shrink-0">
        <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[26px] z-10
          drop-shadow-[0_2px_8px_rgba(124,92,252,0.9)]">▼</div>
        <canvas
          ref={canvasRef}
          width={300} height={300}
          className="rounded-full shadow-[0_0_40px_rgba(124,92,252,0.5)]"
        />
      </div>

      {/* Prize drops */}
      <div className="text-[11px] text-sub uppercase tracking-[0.1em] font-bold w-full text-left">
        Возможный выигрыш
      </div>
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {PRIZES.map((p, i) => (
          <div key={i}
            className={`bg-s1 rounded-xl py-2 px-1 text-center relative
              ${i >= 4 ? 'border border-gold/25' : 'border border-white/[0.04]'}`}>
            {i >= 4 && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold2
                text-[#1a0800] text-[7px] font-black px-1.5 py-px rounded whitespace-nowrap">РЕДКО</div>
            )}
            <div className="text-xl mb-0.5">⭐</div>
            <div className="font-display text-[11px] font-black" style={{ color: p.textColor }}>{p.stars}</div>
          </div>
        ))}
      </div>

      {/* Spin button */}
      <button
        onClick={doSpin}
        disabled={spinning || !!cooldown}
        className="w-full py-4 bg-gradient-to-br from-acc to-neon-pink rounded-[18px] text-white
          text-base font-black shadow-[0_6px_24px_rgba(124,92,252,0.5)] tracking-wide
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform"
      >
        {spinning ? '🎰 Вращение...' : cooldown ? `⏳ ${cooldown}` : '🎰 Крутить!'}
      </button>

      {cooldown && (
        <div className="text-center text-[13px] text-sub font-semibold p-3 bg-s1 rounded-[14px]
          border border-white/[0.04] w-full">
          ⏳ Следующее вращение через {cooldown}
        </div>
      )}

      {/* WIN RESULT MODAL */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/[0.88] backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="bg-gradient-to-br from-[#c0392b] to-[#e74c3c] rounded-[28px] p-10 text-center
                w-[280px] relative overflow-hidden"
            >
              {/* Confetti particles */}
              {['#ffd166', '#ff6b9d', '#7c5cfc', '#06d6a0', '#3a86ff', '#fff'].map((clr, ci) =>
                Array.from({ length: 6 }).map((_, j) => (
                  <div key={`${ci}-${j}`}
                    className="absolute rounded-full"
                    style={{
                      width: 3 + Math.random() * 7,
                      height: 3 + Math.random() * 7,
                      background: clr,
                      left: `${Math.random() * 100}%`,
                      animation: `confettiFall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.6}s both`,
                    }}
                  />
                ))
              )}

              <div className="font-display text-[26px] font-black text-white relative z-10">ВЫ ВЫИГРАЛИ</div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-[80px] my-4 relative z-10 drop-shadow-[0_8px_30px_rgba(255,209,102,0.7)]"
              >
                ⭐
              </motion.div>
              <div className="font-display text-xl font-black text-white relative z-10">
                {result.stars} ЗВЁЗД
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-5 px-8 py-2.5 bg-white/20 border border-white/30 rounded-[14px] text-white
                  text-sm font-extrabold relative z-10 active:scale-95 transition-transform"
              >
                Забрать!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
