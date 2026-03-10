"use client";

import { Facehash } from "facehash";

const avatarColors = ["#D96C3D", "#E8B86D", "#5E8C61", "#2A6F97", "#7B5EA7"];

export function SessionAvatar({ seed }: { seed: string }) {
  return (
    <Facehash
      aria-label="Signed-in user avatar"
      className="shadow-[0_18px_36px_-24px_rgba(15,23,42,0.7)]"
      colors={avatarColors}
      enableBlink
      intensity3d="subtle"
      name={seed}
      size={104}
      variant="gradient"
    />
  );
}
