import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Funtodo — je dag als expeditie",
    template: "%s · Funtodo",
  },
  description:
    "Een todo-lijst die aanvoelt als een expeditie. Eén hoofdquest, drie zijpaden en een kampvuur dat blijft branden.",
  applicationName: "Funtodo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Funtodo",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e7ebe1",
};

const resetServiceWorker = `
(function () {
  if (!("serviceWorker" in navigator)) return;
  var hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    return Promise.all(registrations.map(function (registration) { return registration.unregister(); })).then(function () {
      if (!window.caches) return [];
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      });
    }).then(function () {
      if ((hadController || registrations.length) && !sessionStorage.getItem("funtodo-sw-reset")) {
        sessionStorage.setItem("funtodo-sw-reset", "1");
        location.reload();
      }
    });
  });
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="relative min-h-full">
        {process.env.NODE_ENV !== "production" && (
          <script dangerouslySetInnerHTML={{ __html: resetServiceWorker }} />
        )}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
