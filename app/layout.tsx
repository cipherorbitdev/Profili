import type { Metadata } from "next";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { Atmosphere } from "@/components/ui/atmosphere";
import { ConsentProvider } from "@/lib/consent-context";
import { fontClassName } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/seo";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const site = siteUrl();

export const metadata: Metadata = {
  metadataBase: site,
  title: {
    default: SITE_TITLE,
    template: "%s · Profili",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: new URL("/icon-light.png", site), media: "(prefers-color-scheme: light)", type: "image/png" },
      { url: new URL("/icon-dark.png", site), media: "(prefers-color-scheme: dark)", type: "image/png" },
      { url: new URL("/icon.png", site), sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: new URL("/apple-icon.png", site) }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F2EC" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1B2E" },
  ],
};

const themeBoot = `(function(){try{var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var c=localStorage.getItem("profili-consent");var ok=false;if(c){try{ok=JSON.parse(c).functional===true}catch(e){}}if(ok){var t=localStorage.getItem("profili-theme");if(t==="dark")dark=true;else if(t==="light")dark=false}if(dark){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.style.colorScheme="light"}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontClassName} antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider>
          <ConsentProvider>
            <Atmosphere />
            <SessionProvider>{children}</SessionProvider>
            <CookieBanner />
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
