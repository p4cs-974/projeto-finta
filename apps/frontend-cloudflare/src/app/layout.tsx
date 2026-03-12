import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const systemThemeScript = `
(() => {
	const root = document.documentElement;
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	const applyTheme = (isDark) => {
		root.classList.toggle("dark", isDark);
		root.style.colorScheme = isDark ? "dark" : "light";
	};

	applyTheme(mediaQuery.matches);

	const handleChange = (event) => {
		applyTheme(event.matches);
	};

	if (typeof mediaQuery.addEventListener === "function") {
		mediaQuery.addEventListener("change", handleChange);
	} else {
		mediaQuery.addListener(handleChange);
	}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Finta",
    template: "%s | Finta",
  },
  description:
    "Track stocks and crypto quotes with a server-first financial dashboard built on Next.js.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf8" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="system-theme" strategy="beforeInteractive">
          {systemThemeScript}
        </Script>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="flex min-h-svh flex-col antialiased">{children}</body>
    </html>
  );
}
