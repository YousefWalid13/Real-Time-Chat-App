export default function AnimatedBg() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Top egg shape */}
      <div
        style={{
          position: "absolute",
          top: -30,
          left: "50%",
          marginLeft: -55,
          width: 110,
          height: 130,
          background:
            "radial-gradient(ellipse at 40% 35%, #9333ea 0%, #581c87 55%, transparent 100%)",
          borderRadius: "50% 50% 48% 48%",
          animation: "float 5s ease-in-out infinite",
        }}
      />

      {/* Bottom-right pink blob */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          right: "6%",
          width: 90,
          height: 90,
          background:
            "radial-gradient(circle, #ec4899 0%, #9d174d 70%, transparent 100%)",
          borderRadius: "50%",
          animation: "floatSlow 9s ease-in-out infinite",
          opacity: 0.45,
          filter: "blur(5px)",
        }}
      />

      {/* Left indigo glow */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "3%",
          width: 70,
          height: 70,
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "floatSlow 12s ease-in-out infinite 3s",
          opacity: 0.3,
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}
