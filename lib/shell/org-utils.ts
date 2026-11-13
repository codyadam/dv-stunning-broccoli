export function orgInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 58 + (Math.abs(hash >> 8) % 22);
  const lightness = 48 + (Math.abs(hash >> 16) % 18);

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
