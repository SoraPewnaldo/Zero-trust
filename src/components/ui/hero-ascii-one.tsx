import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function AnimationPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const embedScript = document.createElement('script');
    embedScript.type = 'text/javascript';
    embedScript.textContent = `
      !function(){
        if(!window.UnicornStudio){
          window.UnicornStudio={isInitialized:!1};
          var i=document.createElement("script");
          i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";
          i.onload=function(){
            window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)
          };
          (document.head || document.body).appendChild(i)
        }
      }();
    `;
    document.head.appendChild(embedScript);
    const style = document.createElement('style');
    style.textContent = `
      [data-us-project] {
        position: relative !important;
        overflow: hidden !important;
      }
      
      [data-us-project] canvas {
        clip-path: inset(0 0 10% 0) !important;
      }
      
      [data-us-project] * {
        pointer-events: none !important;
      }
      [data-us-project] a[href*="unicorn"],
      [data-us-project] button[title*="unicorn"],
      [data-us-project] div[title*="Made with"],
      [data-us-project] .unicorn-brand,
      [data-us-project] [class*="brand"],
      [data-us-project] [class*="credit"],
      [data-us-project] [class*="watermark"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
    `;
    document.head.appendChild(style);
    const hideBranding = () => {
      const selectors = ['[data-us-project]', '[data-us-project="OMzqyUv6M3kSnv0JeAtC"]', '.unicorn-studio-container', 'canvas[aria-label*="Unicorn"]'];
      selectors.forEach(selector => {
        const containers = document.querySelectorAll(selector);
        containers.forEach(container => {
          const allElements = container.querySelectorAll('*');
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            const text = (htmlEl.textContent || '').toLowerCase();
            const title = (htmlEl.getAttribute('title') || '').toLowerCase();
            const href = (htmlEl.getAttribute('href') || '').toLowerCase();
            if (text.includes('made with') || text.includes('unicorn') || title.includes('made with') || title.includes('unicorn') || href.includes('unicorn.studio')) {
              htmlEl.style.display = 'none';
              htmlEl.style.visibility = 'hidden';
              htmlEl.style.opacity = '0';
              htmlEl.style.pointerEvents = 'none';
              htmlEl.style.position = 'absolute';
              htmlEl.style.left = '-9999px';
              htmlEl.style.top = '-9999px';
              try {
                htmlEl.remove();
              } catch (e) {
                // Ignore removal errors for non-existent elements
              }
            }
          });
        });
      });
    };
    hideBranding();
    const interval = setInterval(hideBranding, 50);
    setTimeout(hideBranding, 500);
    setTimeout(hideBranding, 1000);
    setTimeout(hideBranding, 2000);
    setTimeout(hideBranding, 5000);
    setTimeout(hideBranding, 10000);
    return () => {
      clearInterval(interval);
      document.head.removeChild(embedScript);
      document.head.removeChild(style);
    };
  }, []);
  return <main className="relative min-h-screen overflow-hidden bg-black">
    {/* Background Animation */}
    <div className="absolute inset-0 w-full h-full hidden lg:block">
      <div data-us-project="OMzqyUv6M3kSnv0JeAtC" style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh'
      }} />
    </div>

    {/* Mobile background */}
    <div className="absolute inset-0 w-full h-full lg:hidden">
      <div className="absolute inset-0 stars-layer-1"></div>
      <div className="absolute inset-0 stars-layer-2"></div>
      <div className="absolute inset-0 stars-layer-3"></div>
      <div className="absolute inset-0 mobile-grid-bg"></div>
      <div className="absolute inset-0 mobile-glow"></div>
    </div>

    {/* Top Header */}
    <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/20">
      <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="font-mono text-white text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12">soraIAM</div>
          <div className="h-3 lg:h-4 w-px bg-white/40"></div>
          <span className="text-white/60 text-[8px] lg:text-[10px] font-mono">EST. 2025</span>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-white/60">
          <span>LAT: 37.7749°</span>
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          <span>LONG: 122.4194°</span>
        </div>
      </div>
    </div>

    {/* Corner Frame Accents */}
    <div className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
    <div className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
    <div className="absolute left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/30 z-20" style={{
      bottom: '5vh'
    }}></div>
    <div className="absolute right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/30 z-20" style={{
      bottom: '5vh'
    }}></div>

    {/* CTA Content */}
    <div className="relative z-10 flex min-h-screen items-center justify-center lg:justify-end pt-16 lg:pt-0" style={{
      marginTop: '5vh'
    }}>
      <div className="w-full lg:w-1/2 px-6 lg:px-16 lg:pr-[10%]">
        <div className="max-w-lg relative lg:ml-auto">
          {/* Top decorative line */}
          <div className="flex items-center gap-2 mb-3 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">∞</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>

          {/* Title with dithered accent */}
          <div className="relative">
            <div className="hidden lg:block absolute -right-3 top-0 bottom-0 w-1 dither-pattern opacity-40"></div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 leading-tight font-mono tracking-wider lg:whitespace-nowrap lg:-ml-[5%]" style={{
              letterSpacing: '0.1em'
            }}>ZERO TRUST DEMO</h1>
          </div>

          {/* Decorative dots pattern - desktop only */}
          <div className="hidden lg:flex gap-1 mb-3 opacity-40">
            {Array.from({
              length: 40
            }).map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full"></div>)}
          </div>

          {/* Description with subtle grid pattern */}
          <div className="relative">
            <p className="text-xs lg:text-base text-gray-300 mb-5 lg:mb-6 leading-relaxed font-mono opacity-80">Like Sisyphus, we push forward — not despite the risk, but because of it. Every access request, every trust evaluation, every policy decision is our boulder.</p>

            {/* Technical corner accent - desktop only */}
            <div className="hidden lg:block absolute -left-4 top-1/2 w-3 h-3 border border-white opacity-30" style={{
              transform: 'translateY(-50%)'
            }}>
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white" style={{
                transform: 'translate(-50%, -50%)'
              }}></div>
            </div>
          </div>

          {/* Buttons with technical accents */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
            <button onClick={() => navigate('/login')} className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent text-white font-mono text-xs lg:text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group">
              <span className="hidden lg:block absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="hidden lg:block absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              INITIATE ACCESS
            </button>

            <button onClick={() => navigate('/login')} className="relative px-5 lg:px-6 py-2 lg:py-2.5 bg-transparent border border-white text-white font-mono text-xs lg:text-sm hover:bg-white hover:text-black transition-all duration-200" style={{
              borderWidth: '1px'
            }}>
              SECURE LOGIN
            </button>
          </div>

          {/* Bottom technical notation - desktop only */}
          <div className="hidden lg:flex items-center gap-2 mt-6 opacity-40">
            <span className="text-white text-[9px] font-mono">∞</span>
            <div className="flex-1 h-px bg-white"></div>
            <span className="text-white text-[9px] font-mono">SISYPHUS.PROTOCOL</span>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Footer */}
    <div className="absolute left-0 right-0 z-20 border-t border-white/20 bg-black/40 backdrop-blur-sm" style={{
      bottom: '5vh'
    }}>
      <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-6 text-[8px] lg:text-[9px] font-mono text-white/50">
          <span className="hidden lg:inline">SYSTEM.ACTIVE</span>
          <span className="lg:hidden">SYS.ACT</span>
          <div className="hidden lg:flex gap-1">
            {Array.from({
              length: 8
            }).map((_, i) => <div key={i} className="w-1 h-3 bg-white/30" style={{
              height: `${Math.random() * 12 + 4}px`
            }}></div>)}
          </div>
          <span>V1.0.0</span>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 text-[8px] lg:text-[9px] font-mono text-white/50">
          <span className="hidden lg:inline">◐ RENDERING</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{
              animationDelay: '0.2s'
            }}></div>
            <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{
              animationDelay: '0.4s'
            }}></div>
          </div>
          <span className="hidden lg:inline">FRAME: ∞</span>
        </div>
      </div>
    </div>

    <style>{`
        .dither-pattern {
          background-image: 
            repeating-linear-gradient(0deg, transparent 0px, transparent 1px, white 1px, white 2px),
            repeating-linear-gradient(90deg, transparent 0px, transparent 1px, white 1px, white 2px);
          background-size: 3px 3px;
        }
        
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
        
        .mobile-grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        
        .mobile-glow {
          background: radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.06) 0%, transparent 60%);
        }
      `}</style>
  </main>;
}