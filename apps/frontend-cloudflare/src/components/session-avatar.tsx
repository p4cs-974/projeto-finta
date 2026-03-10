"use client";

import { Facehash } from "facehash";

const avatarColors = ["#d42d57", "#14a8c2", "#6dce0c", "#d9673d", "#9D0033"];

export function SessionAvatar({
  seed,
  size = 104,
}: {
  seed: string;
  size?: number;
}) {
  return (
    <Facehash
      aria-label="Signed-in user avatar"
      className="shadow-[0_18px_36px_-24px_rgba(15,23,42,0.7)]"
      colors={avatarColors}
      enableBlink
      intensity3d="none"
      name={seed}
      size={size}
      variant="solid"
    />
  );
}
