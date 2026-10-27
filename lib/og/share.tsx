import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Profili: Your resume can talk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F5F2EC";
const INK = "#0E1B2E";
const MUTED = "#5B6675";

async function markSrc() {
  const png = await readFile(join(process.cwd(), "public/brand/mark.png"));
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function fontData() {
  return readFile(join(process.cwd(), "app/fonts/InstrumentSans-Medium.woff"));
}

export async function shareImage({
  title,
  subtitle,
  kicker = "Profili",
  label,
}: {
  title: string;
  subtitle: string;
  kicker?: string;
  label?: string;
}) {
  const [logo, font] = await Promise.all([markSrc(), fontData()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "64px 72px",
          fontFamily: "Instrument Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={logo} width={44} height={44} alt="" />
          <div style={{ fontSize: 28, letterSpacing: "0.04em", fontWeight: 500 }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
          {label ? (
            <div style={{ fontSize: 20, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>
              {label}
            </div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 28 ? 64 : 76,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: MUTED, lineHeight: 1.35 }}>{subtitle}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Instrument Sans", data: font, weight: 500, style: "normal" }],
    },
  );
}
