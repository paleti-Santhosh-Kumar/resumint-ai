/** Fixed animated background: aurora blobs + perspective grid + noise. */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink-950">
      {/* base radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 70% -10%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(1000px 600px at 10% 10%, rgba(6,182,212,0.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(236,72,153,0.12), transparent 55%)",
        }}
      />
      {/* aurora blobs */}
      <div
        className="aurora animate-float-slow"
        style={{ width: 520, height: 520, top: -120, left: -80, background: "radial-gradient(circle, #7c3aed, transparent 70%)" }}
      />
      <div
        className="aurora animate-float"
        style={{ width: 460, height: 460, top: 120, right: -100, background: "radial-gradient(circle, #06b6d4, transparent 70%)", animationDelay: "1.5s" }}
      />
      <div
        className="aurora animate-pulse-glow"
        style={{ width: 420, height: 420, bottom: -120, left: "35%", background: "radial-gradient(circle, #ec4899, transparent 70%)", opacity: 0.4 }}
      />
      {/* grid */}
      <div className="absolute inset-0 grid-bg" />
    </div>
  );
}
