import { cn } from "@heroui/react";

interface LogoProps {
  size?: number;
  animation?: boolean;
}

export default function Logo({ size = 4, animation = false }: LogoProps) {
  return (
    <div
      className={cn(`size-${size.toString()} bg-foreground rounded-full`, {
        "animate-pulse": animation,
      })}
    />
  );
}
