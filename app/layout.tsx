import type { Metadata } from "next";
import { Roboto_Slab } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-roboto-slab", display: "swap" });

export const metadata: Metadata = {
  title: "SocialCraft — Content Intelligence",
  description: "Turn social media documents, screenshots, and posts into clear editorial briefs."
};

const themeScript = `(function(){try{var t=localStorage.getItem("socialcraft-theme")||localStorage.getItem("socialforge-theme");if(t==="moon")t="midnight";if(t&&["sunrise","sunset","midnight"].indexOf(t)!==-1){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={robotoSlab.variable} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
