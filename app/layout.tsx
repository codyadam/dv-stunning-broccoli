import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";
import { siteFontClassName } from "@/app/fonts";
import { AppProviders } from "@/components/providers/app-providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "DataVendor | Monetize your data supply",
    template: "%s | DataVendor",
  },
  description:
    "DataVendor matches valuable code and data with AI companies that need high-quality training and evaluation supply.",
  applicationName: "DataVendor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={siteFontClassName}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense>
            <AppProviders>
              <TooltipProvider>{children}</TooltipProvider>
            </AppProviders>
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
