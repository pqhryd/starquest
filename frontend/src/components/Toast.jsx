import { motion } from 'framer-motion';

export default function Toast({ message, type = 'info' }) {
  const colors = {
    ok:   'border-neon-green/50 text-neon-green',
    err:  'border-neon-red/50 text-neon-red',
    info: 'border-acc/50 text-acc2',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 14, x: '-50%' }}
      className={`fixed bottom-[86px] left-1/2 bg-s2 border rounded-[14px] px-4 py-2.5
        text-xs font-bold whitespace-nowrap z-[500] max-w-[calc(100vw-48px)] text-center
        ${colors[type] || colors.info}`}
    >
      {message}
    </motion.div>
  );
}
