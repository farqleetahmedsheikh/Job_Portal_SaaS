/** @format */

import "./globals.css";
import "./styles/tokens.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { SessionStoreProvider } from "./store/session.store";
import { SessionProvider } from "./components/providers/SessionProvider";

// Runs before first paint — prevents theme flash
const THEME_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('HiringFly-theme');
    var p = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t || p);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must be first in <head> — blocks render until theme is known */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <SessionStoreProvider>
            <SessionProvider>{children}</SessionProvider>
          </SessionStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
