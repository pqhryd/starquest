import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * NFTShowcase — premium display with parallax tilt, holographic shine, and glow effects.
 * Used for NFT avatar displays and mystery box cards.
 */
export default function NFTShowcase({ children, className = '', glowColor = 'rgba(124,92,252,0.5)' }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * 20, y: (x - 0.5) * -20 });
    setShine({ x: x * 100, y: y * 100 });
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const resetTilt = () => {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
    setHovering(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => { setHovering(true); handleMove(e); }}
      onMouseLeave={resetTilt}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      className={`relative rounded-[24px] overflow-hidden ${className}`}
    >
      {/* Holographic shine overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovering ? 0.6 : 0.15,
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%,
            rgba(255,255,255,0.3) 0%, transparent 50%)`,
        }}
      />

      {/* Animated border glow */}
      <div
        className="absolute -inset-[1px] rounded-[24px] z-0 transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0.3,
          background: `conic-gradient(from 0deg, ${glowColor}, transparent, ${glowColor}, transparent, ${glowColor})`,
          animation: 'nftRotate 4s linear infinite',
        }}
      />

      {/* Inner glow pulse */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 z-0 rounded-[24px]"
        style={{ boxShadow: `inset 0 0 60px ${glowColor}` }}
      />

      {/* Content */}
      <div className="relative z-[5] bg-s1/90 m-[1px] rounded-[23px] overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}
