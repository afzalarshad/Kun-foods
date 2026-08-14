"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-chili px-5 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark"
    >
      🖨️ Print
    </button>
  );
}
