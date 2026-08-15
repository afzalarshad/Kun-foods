import QRCode from "qrcode";

export function QrCode({ data, size = 96 }: { data: string; size?: number }) {
  const qr = QRCode.create(data, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const count = modules.size;
  const cell = size / count;

  const rects: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (modules.get(row, col)) {
        rects.push(`M${col * cell},${row * cell}h${cell}v${cell}h-${cell}z`);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="shrink-0"
      role="img"
      aria-label="Scannable order code"
    >
      <rect width={size} height={size} fill="white" />
      <path d={rects.join(" ")} fill="black" />
    </svg>
  );
}
