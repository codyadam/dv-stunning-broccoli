import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const siteFontClassName = cn(
  "h-full antialiased",
  geistSans.variable,
  geistMono.variable,
);
