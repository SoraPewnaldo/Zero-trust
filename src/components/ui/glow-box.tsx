import { cn } from "@/lib/utils";
import { GlowingEffect } from "./glowing-effect";

interface GlowBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowBox({ children, className }: GlowBoxProps) {
  return (
    <div className={cn("relative", className)}>
      <GlowingEffect
        spread={40}
        glow={false}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={1}
        variant="white"
        blur={0}
        movementDuration={1}
      />
      {children}
    </div>
  );
}
