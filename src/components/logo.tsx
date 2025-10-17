import { cn } from "@heroui/react";

interface LogoProps {
  size?: number;
  animation?: boolean;
}

export default function Logo({ size = 4, animation = false }: LogoProps) {
  return (
    <div
      style={{ width: size * 4, height: size * 4 }}
      className={cn("bg-foreground rounded-full", {
        "animate-pulse": animation,
      })}
    />
  );
}
