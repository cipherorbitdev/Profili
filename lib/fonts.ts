import {
  IBM_Plex_Mono,
  Instrument_Sans,
  Instrument_Serif,
  Plus_Jakarta_Sans,
} from "next/font/google";

/**
 * Product typefaces. Change the constructors below to restyle the app.
 * Screens already use `font-sans`, `font-heading`, and `font-mono`.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-src",
});

const heading = sans;

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-mono-src",
});

const display = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-src",
});

const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: "italic",
  variable: "--font-display-serif-src",
});

export const fontClassName = [
  sans.variable,
  heading !== sans ? heading.variable : "",
  mono.variable,
  display.variable,
  displaySerif.variable,
]
  .filter(Boolean)
  .join(" ");
