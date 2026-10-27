import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAPER = "#F5F2EC";
const INK = "#0E1B2E";
const CLEAR = 0.14;

function pngToIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let offset = 6 + 16 * count;
  const entries = [];
  for (const { width, height, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

async function cropEmbeddedMark() {
  const svg = await readFile(join(root, "public/brand/logo.svg"), "utf8");
  const matches = [...svg.matchAll(/xlink:href="data:image\/png;base64,([^"]+)"/g)];
  const encoded = matches.at(-1)?.[1];
  if (!encoded) throw new Error("Could not extract the embedded mark PNG from public/brand/logo.svg");
  const source = Buffer.from(encoded, "base64");
  const meta = await sharp(source).metadata();
  const imgW = meta.width ?? 1585;
  const imgH = meta.height ?? 2400;
  const scaleX = 0.38612;
  const scaleY = 0.386562;
  const tx = 442.959643;
  const ty = 314.116945;
  const clip = { x: 525, y: 412.5, w: 450, h: 675 };
  const left = Math.max(0, Math.floor((clip.x - tx) / scaleX));
  const top = Math.max(0, Math.floor((clip.y - ty) / scaleY));
  const width = Math.min(imgW - left, Math.ceil(clip.w / scaleX));
  const height = Math.min(imgH - top, Math.ceil(clip.h / scaleY));
  return sharp(source).extract({ left, top, width, height }).ensureAlpha();
}

async function extractMarkColor() {
  const { data, info } = await (await cropEmbeddedMark()).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (luminance < 0.04) data[i + 3] = 0;
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function extractMarkAlpha() {
  const { data, info } = await (await cropEmbeddedMark()).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const cover = luminance < 0.04 ? 0 : a;
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = cover;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function placeMark(sourcePng, size, { background, inset = CLEAR, tint } = {}) {
  const inner = Math.round(size * (1 - 2 * inset));
  let markPipeline = sharp(sourcePng).resize(inner, inner, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (tint) {
    markPipeline = markPipeline.composite([
      {
        input: {
          create: {
            width: inner,
            height: inner,
            channels: 4,
            background: tint,
          },
        },
        blend: "in",
      },
    ]);
  }
  const mark = await markPipeline.png().toBuffer();
  const canvas = background
    ? { width: size, height: size, channels: 4, background }
    : { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } };

  return sharp({ create: canvas })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

function hexToRgba(hex) {
  const n = hex.replace("#", "");
  return {
    r: Number.parseInt(n.slice(0, 2), 16),
    g: Number.parseInt(n.slice(2, 4), 16),
    b: Number.parseInt(n.slice(4, 6), 16),
    alpha: 1,
  };
}

async function main() {
  await mkdir(join(root, "app"), { recursive: true });
  await mkdir(join(root, "public"), { recursive: true });
  await mkdir(join(root, "public/brand"), { recursive: true });
  await mkdir(join(root, "app/fonts"), { recursive: true });

  const colorPng = await (await extractMarkColor()).toBuffer();
  const alphaPng = await (await extractMarkAlpha()).toBuffer();
  await writeFile(join(root, "public/brand/mark.png"), colorPng);

  const paper = hexToRgba(PAPER);
  const ink = hexToRgba(INK);

  const sizes = {
    fav16: await placeMark(colorPng, 16, { background: paper, inset: 0.12 }),
    fav32: await placeMark(colorPng, 32, { background: paper, inset: 0.12 }),
    fav48: await placeMark(colorPng, 48, { background: paper, inset: 0.13 }),
    icon512: await placeMark(colorPng, 512, { background: paper }),
    apple: await placeMark(colorPng, 180, { background: paper }),
    pwa192: await placeMark(colorPng, 192, { background: paper }),
    pwa512: await placeMark(colorPng, 512, { background: paper }),
    maskable: await placeMark(colorPng, 512, { background: paper, inset: 0.18 }),
    light: await placeMark(alphaPng, 512, { background: paper, tint: INK }),
    dark: await placeMark(alphaPng, 512, { background: ink, tint: PAPER }),
  };

  await writeFile(
    join(root, "app/favicon.ico"),
    pngToIco([
      { width: 16, height: 16, png: sizes.fav16 },
      { width: 32, height: 32, png: sizes.fav32 },
      { width: 48, height: 48, png: sizes.fav48 },
    ]),
  );
  await writeFile(join(root, "app/icon.png"), sizes.icon512);
  await writeFile(join(root, "app/apple-icon.png"), sizes.apple);
  await writeFile(join(root, "public/icon-192.png"), sizes.pwa192);
  await writeFile(join(root, "public/icon-512.png"), sizes.pwa512);
  await writeFile(join(root, "public/icon-maskable-512.png"), sizes.maskable);
  await writeFile(join(root, "public/icon-light.png"), sizes.light);
  await writeFile(join(root, "public/icon-dark.png"), sizes.dark);

  const fontSrc = join(
    root,
    "node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff",
  );
  await copyFile(fontSrc, join(root, "app/fonts/InstrumentSans-Medium.woff"));
  console.log("Wrote icons from public/brand/logo.svg and bundled Instrument Sans Medium.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
