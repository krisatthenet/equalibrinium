import React, { useEffect, useState } from 'react';

const COLOURS = ['#f5c518', '#ffffff', '#ffd700', '#fffacd', '#fff8dc'];
const COUNT = 60;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

const SparklesIntro = () => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    try { if (sessionStorage.getItem('sparkles_shown')) return; } catch {}
    try { sessionStorage.setItem('sparkles_shown', '1'); } catch {}

    const pts = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: rand(0, 100),
      y: rand(0, 100),
      size: rand(4, 10),
      color: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      delay: rand(0, 600),
      duration: rand(800, 1600),
      tx: rand(-120, 120),
      ty: rand(-120, 120),
    }));

    setParticles(pts);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `sparkle-fly ${p.duration}ms ease-out ${p.delay}ms both`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes sparkle-fly {
          0%   { transform: translate(0,0) scale(0); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SparklesIntro;
