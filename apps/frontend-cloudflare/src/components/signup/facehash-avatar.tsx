"use client";

import { Facehash } from "facehash";

const avatarColors = ["#FF3366", "#00D9FF", "#7FFF00", "#FF6B35", "#9D00FF"];

export function FacehashAvatar({ name }: { name: string }) {
  return (
    <Facehash
      aria-label="Live FaceHash avatar preview"
      className="shadow-[0_12px_24px_-18px_rgba(15,23,42,0.7)]"
      colors={avatarColors}
      enableBlink
      intensity3d="subtle"
      name={name}
      size={88}
      variant="gradient"
    />
  );
}
