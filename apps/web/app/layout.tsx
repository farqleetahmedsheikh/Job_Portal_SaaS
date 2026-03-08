/** @format */

import "./globals.css";
import "./styles/tokens.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { SessionStoreProvider } from "./store/session.store";
import { SessionProvider } from "./components/providers/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SessionStoreProvider>
            {" "}
            {/* ← add this */}
            <SessionProvider>{children}</SessionProvider>
          </SessionStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}