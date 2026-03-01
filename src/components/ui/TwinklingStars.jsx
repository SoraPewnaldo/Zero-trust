import React from 'react';

export const TwinklingStars = () => {
    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-black">
            <div className="absolute inset-0 stars-layer-1"></div>
            <div className="absolute inset-0 stars-layer-2"></div>
            <div className="absolute inset-0 stars-layer-3"></div>
            <div className="absolute inset-0 grid-bg"></div>
            <div className="absolute inset-0 glow-overlay"></div>

            <style>{`
        @keyframes twinkle1 {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.3; }
        }
        @keyframes twinkle2 {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        @keyframes twinkle3 {
          0%, 100% { opacity: 0.7; }
          40% { opacity: 0.2; }
          80% { opacity: 1; }
        }
        
        .stars-layer-1 {
          background-image: 
            radial-gradient(1.5px 1.5px at 10% 15%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 35% 10%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 75% 25%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 90% 45%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 25% 85%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 65% 90%, rgba(255,255,255,0.5), transparent);
          background-size: 200px 200px, 300px 300px, 270px 270px, 190px 190px, 210px 210px, 230px 230px, 220px 220px;
          animation: twinkle1 4s ease-in-out infinite;
        }
        
        .stars-layer-2 {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 45% 65%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 5% 55%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 40% 35%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 95% 85%, rgba(255,255,255,0.6), transparent);
          background-size: 250px 250px, 180px 180px, 240px 240px, 280px 280px, 250px 250px, 260px 260px, 210px 210px;
          animation: twinkle2 6s ease-in-out infinite;
        }
        
        .stars-layer-3 {
          background-image: 
            radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 33% 80%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 15% 60%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 85% 75%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 55% 20%, rgba(255,255,255,0.5), transparent);
          background-size: 220px 220px, 260px 260px, 200px 200px, 170px 170px, 190px 190px, 240px 240px;
          animation: twinkle3 5s ease-in-out infinite;
        }
        
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        
        .glow-overlay {
          background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 60%);
        }
      `}</style>
        </div>
    );
};
