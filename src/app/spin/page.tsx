'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BubbleBackground from '@/components/BubbleBackground';
import SpinWheel from '@/components/SpinWheel';

export default function SpinPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BubbleBackground count={12} />
      <Header />

      <div className="relative z-10 pt-28 pb-16 px-4 flex flex-col items-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 w-full"
        >
          <h1 className="font-cartoon text-4xl md:text-5xl lg:text-6xl mb-4 leading-none">
            <span style={{ color: '#fff' }}>DAILY </span>
            <span
              style={{
                color: '#00d4ff',
                WebkitTextStroke: '2px rgba(255,255,255,0.15)',
              }}
            >
              SPIN
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base md:text-lg max-w-md mx-auto leading-relaxed font-body"
            style={{ color: 'rgba(232, 244, 255, 0.5)' }}
          >
            Spin the whale wheel once per day to earn{' '}
            <span className="font-bold" style={{ color: '#00f7ff' }}>
              $WHITEWHALE
            </span>{' '}
            tokens!
          </motion.p>
        </motion.div>

        {/* Spin Wheel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center"
        >
          <SpinWheel />
        </motion.div>
      </div>
    </main>
  );
}
