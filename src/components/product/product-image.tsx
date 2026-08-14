const PALETTES = [
  "from-chili to-chili-dark",
  "from-saffron to-saffron-dark",
  "from-basil to-basil-dark",
  "from-plum to-chili",
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

export function ProductImage({
  emoji,
  seed,
  className = "",
  shape = "blob",
  size = "text-6xl",
}: {
  emoji: string;
  seed: string;
  className?: string;
  shape?: "blob" | "blob-alt" | "circle";
  size?: string;
}) {
  const palette = paletteFor(seed);
  const radius =
    shape === "circle" ? "rounded-full" : shape === "blob-alt" ? "blob-alt" : "blob";

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${palette} ${radius} ${className}`}
    >
      <span className={`${size} drop-shadow-sm select-none`} aria-hidden>
        {emoji}
      </span>
    </div>
  );
}
