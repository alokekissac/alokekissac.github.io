import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "radial-gradient(circle at 78% 28%, #1c2350 0%, #06060a 55%)",
          color: "#ededf2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#a0a0b0" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#5ee6b8" }} />
          Available for opportunities
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 40, color: "#a0a0b0" }}>Hi, I&apos;m Aloke.</div>
          <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -4, lineHeight: 1 }}>AI Engineer</div>
          <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -4, lineHeight: 1, color: "#8ea2ff" }}>
            &amp; Full Stack Developer
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#74748a" }}>Intelligent systems · AI applications · Interactive products</div>
      </div>
    ),
    size,
  );
}
