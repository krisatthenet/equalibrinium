import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const D20Icon = ({ className }) => {
  const [result, setResult] = useState(20);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = (e) => {
    if (isRolling) return;
    setIsRolling(true);
    
    // Generate random number after a short delay to sync with animation
    setTimeout(() => {
      setResult(Math.floor(Math.random() * 20) + 1);
      setIsRolling(false);
    }, 600);
  };

  useEffect(() => {
    rollDice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn("relative cursor-pointer select-none group flex items-center justify-center", className)}
      onClick={rollDice}
      title="Roll for initiative!"
    >
      <div className={cn("w-full h-full transition-transform duration-300 flex items-center justify-center", isRolling ? "animate-roll-d20" : "hover:scale-110 hover:rotate-12")}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {/* Base white background */}
          <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="#ffffff" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
          
          {/* Top Left */}
          <path d="M50 5 L5 30 L50 25 Z" fill="rgba(255,255,255,0.9)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Top Right */}
          <path d="M50 5 L95 30 L50 25 Z" fill="rgba(0,0,0,0.03)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Mid Left */}
          <path d="M5 30 L25 65 L50 25 Z" fill="rgba(255,255,255,0.5)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Mid Right */}
          <path d="M95 30 L75 65 L50 25 Z" fill="rgba(0,0,0,0.08)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Center Face */}
          <path d="M50 25 L25 65 L75 65 Z" fill="#ffffff" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Bottom Left */}
          <path d="M5 30 L5 70 L25 65 Z" fill="rgba(0,0,0,0.12)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Bottom Right */}
          <path d="M95 30 L95 70 L75 65 Z" fill="rgba(0,0,0,0.2)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Bottom Mid Left */}
          <path d="M5 70 L50 95 L25 65 Z" fill="rgba(0,0,0,0.15)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Bottom Mid Right */}
          <path d="M95 70 L50 95 L75 65 Z" fill="rgba(0,0,0,0.25)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Bottom Center */}
          <path d="M25 65 L75 65 L50 95 Z" fill="rgba(0,0,0,0.08)" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-black font-extrabold text-xl md:text-2xl tracking-tighter" 
            style={{ transform: 'translateY(2px)' }}
          >
            {isRolling ? '...' : result}
          </span>
        </div>
      </div>
    </div>
  );
};

export default D20Icon;