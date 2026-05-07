import React, { useEffect, useState } from 'react';

const PALETTE = [
  '#ff4444', '#ff8800', '#ffdd00', '#44ff44', '#44ddff',
  '#8844ff', '#ff44cc', '#ffffff', '#ffd700', '#ff6b6b',
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

function buildFireworks(roll) {
  const count = roll >= 20 ? 12 : roll >= 15 ? 8 : roll >= 10 ? 5 : 3;
  return Array.from({ length: count }, (_, i) => {
    const x = rand(10, 90);
    const burstY = rand(10, 55);
    const color = PALETTE[randInt(0, PALETTE.length - 1)];
    const delay = i * rand(120, 260);
    const particles = Array.from({ length: roll >= 20 ? 22 : roll >= 15 ? 16 : 10 }, (__, j) => {
      const angle = (j / (roll >= 20 ? 22 : roll >= 15 ? 16 : 10)) * 360;
      const dist = rand(40, roll >= 20 ? 140 : roll >= 15 ? 100 : 70);
      const rad = (angle * Math.PI) / 180;
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist,
        color: Math.random() > 0.3 ? color : PALETTE[randInt(0, PALETTE.length - 1)],
        size: rand(3, roll >= 20 ? 8 : 6),
      };
    });
    return { id: i, x, burstY, color, delay, particles };
  });
}

const FireworksIntro = ({ roll }) => {
  const [fireworks, setFireworks] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setFireworks(buildFireworks(roll));
    setVisible(true);
    const t = setTimeout(() => setVisible(false), roll >= 20 ? 4000 : 3000);
    return () => clearTimeout(t);
  }, [roll]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
      {fireworks.map((fw) => (
        <div key={fw.id} style={{ position: 'absolute', left: `${fw.x}%`, top: `${fw.burstY}%` }}>
          {/* rocket trail */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 3,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(to top, transparent, ${fw.color})`,
              animation: `rocket-up 0.5s ease-out ${fw.delay}ms both`,
            }}
          />
          {/* burst particles */}
          {fw.particles.map((p, j) => (
            <div
              key={j}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                animation: `burst-out 1.2s ease-out ${fw.delay + 480}ms both`,
              }}
            />
          ))}
        </div>
      ))}

      <style>{`
        @keyframes rocket-up {
          0%   { transform: translateY(120px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @keyframes burst-out {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          70%  { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FireworksIntro;
