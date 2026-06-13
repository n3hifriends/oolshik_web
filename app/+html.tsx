import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";

// Web-only document shell. Injects Leaflet's stylesheet and base resets.
// This file has no effect on native.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Oolshik Admin</title>
        {/* Leaflet map styles */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          html, body, #root { height: 100%; }
          body { margin: 0; background: #F7F6F3; }
        `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
