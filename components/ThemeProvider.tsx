"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      {children as React.ReactElement}
    </NextThemesProvider>
  );
}
