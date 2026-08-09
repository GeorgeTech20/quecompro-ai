import { ImageResponse } from "next/og";

export const alt = "QuéComproo, la lista de compras compartida de tu casa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#c7edf7",
        color: "#142a3a",
        padding: "76px 86px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            borderRadius: 999,
            background: "rgba(255,255,255,.72)",
            padding: "12px 20px",
            fontSize: 24,
          }}
        >
          Compras del hogar, sin caos
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            color: "#e9342b",
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-5px",
            lineHeight: 0.94,
          }}
        >
          ¿Qué compro?
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, lineHeight: 1.25 }}>
          Una lista compartida, precios y una IA para decidir mejor.
        </div>
      </div>

      <div
        style={{
          width: 290,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 70,
          background: "rgba(255,255,255,.72)",
          boxShadow: "0 18px 0 #9fd9e8",
        }}
      >
        <div
          style={{
            width: 196,
            height: 134,
            display: "flex",
            position: "relative",
            border: "9px solid #9f211e",
            borderRadius: 28,
            background: "#e9342b",
            boxShadow: "0 12px 0 #9f211e",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 21,
              right: 21,
              top: -52,
              height: 58,
              border: "12px solid #142a3a",
              borderBottom: "none",
              borderRadius: "28px 28px 0 0",
            }}
          />
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              style={{
                width: 15,
                height: 72,
                marginLeft: slot === 0 ? 23 : 22,
                marginTop: 28,
                borderRadius: 999,
                background: "#ffc5c0",
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
