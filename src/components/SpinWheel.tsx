import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SpinWheelProps {
  items: string[];
  onSpinEnd: (selectedItem: string) => void;
}

export function SpinWheel({ items, onSpinEnd }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const colors = [
    "#f59e0b", // amber-500
    "#d97706", // amber-600
    "#b45309", // amber-700
    "#92400e", // amber-800
    "#78350f", // amber-900
    "#171717", // neutral-900
    "#262626", // neutral-800
    "#404040", // neutral-700
  ];

  const handleSpin = () => {
    if (isSpinning || items.length === 0) return;
    setIsSpinning(true);

    const sliceAngle = 360 / items.length;
    // Target a random item. The pointer is at 12 o'clock (0 or 360 deg, wait it depends on our SVG offset).
    // Our SVG draws starting from top (0 deg)? Let's assume standard math starting at 3 o'clock (0 deg) or top (-90deg).
    // We will align the wheel so that the pointer is at the right edge (90 deg) or top (0 deg).
    // Let's have the pointer at the Top (270 degrees in SVG, or just rotate the entire SVG container -90deg so 0 is Top).

    const selectedIndex = Math.floor(Math.random() * items.length);
    
    // Each item's center is at: selectedIndex * sliceAngle + (sliceAngle / 2)
    // To land on it at the top (which we define as 0 degree relative),
    // we need to rotate backwards by that angle, plus full spins.
    
    const extraSpins = 5; // number of full spins
    const itemCenterOffset = (selectedIndex * sliceAngle) + (sliceAngle / 2);
    // the target rotation needs to make the itemCenterOffset land at 0 (top).
    // so we rotate by (360 * extraSpins) - itemCenterOffset
    
    const targetRotation = rotation + (360 * extraSpins) + (360 - (itemCenterOffset % 360));

    setRotation(targetRotation);

    // wait for animation
    setTimeout(() => {
      setIsSpinning(false);
      onSpinEnd(items[selectedIndex]);
    }, 5000); 
  };

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // SVG drawing logic for slices
  const totalItems = items.length;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-80 h-80 sm:w-96 sm:h-96">
        {/* Pointer at the top */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-500 drop-shadow-xl" />
        
        {totalItems > 0 ? (
          <motion.div
            className="w-full h-full rounded-full overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] border-4 border-amber-500 bg-[#0a0a0a]"
            animate={{ rotate: rotation }}
            initial={{ rotate: 0 }}
            transition={{ duration: 5, ease: [0.32, 0.72, 0.15, 1] }} // smooth ease out
            style={{ transformOrigin: "center center" }}
          >
            <svg viewBox="-1 -1 2 2" className="w-full h-full " style={{ transform: "rotate(-90deg)" }}>
              {items.length === 1 ? (
                <circle cx="0" cy="0" r="1" fill={colors[0]} />
              ) : (
                items.map((item, index) => {
                  const percent = 1 / totalItems;
                  const startPercent = index * percent;
                  const endPercent = startPercent + percent;
                  
                  const [startX, startY] = getCoordinatesForPercent(startPercent);
                  const [endX, endY] = getCoordinatesForPercent(endPercent);
                  
                  // Large arc flag is required if slice is > 180 degrees
                  const largeArcFlag = percent > 0.5 ? 1 : 0;
                  
                  const pathData = [
                    `M ${startX} ${startY}`, // Move
                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
                    `L 0 0`, // Line
                  ].join(' ');

                  // Compute text rotation and position
                  const midPercent = startPercent + (percent / 2);
                  const textRotation = midPercent * 360;

                  return (
                    <g key={index}>
                      <path d={pathData} fill={colors[index % colors.length]} />
                      <g transform={`rotate(${textRotation}) translate(0.5, 0)`}>
                        <text
                          x="0"
                          y="0"
                          fill="white"
                          fontSize="0.12"
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          transform="rotate(0)" // keeps it pointing outward
                          pointerEvents="none"
                        >
                          {item}
                        </text>
                      </g>
                    </g>
                  );
                })
              )}
            </svg>
          </motion.div>
        ) : (
          <div className="w-full h-full rounded-full border-4 border-white/10 bg-[#0a0a0a] flex items-center justify-center text-white/40 p-8 text-center text-xs uppercase tracking-widest">
            Add movies to see the wheel!
          </div>
        )}
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || totalItems === 0}
        className="mt-8 px-10 py-4 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
      >
        {isSpinning ? "SPINNING..." : "SPIN IT!"}
      </button>
    </div>
  );
}
