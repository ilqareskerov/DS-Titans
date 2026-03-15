'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = [
  '#7c3aed', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#ffd700', // gold
];

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const generateConfetti = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 720 - 360,
        size: 6 + Math.random() * 8,
      });
    }
    setPieces(newPieces);
  }, []);

  useEffect(() => {
    if (trigger) {
      generateConfetti();
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [trigger, generateConfetti, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map(piece => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: -20,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: piece.rotation,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
  }, []);

  const handleComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return { showConfetti, triggerConfetti, handleComplete };
}
