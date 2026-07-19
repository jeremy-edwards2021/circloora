import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Circloora — Circular ownership agent",
    short_name: "Circloora",
    description:
      "Remember what you own, understand its value, and move it into its best next life.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2eee6",
    theme_color: "#f2eee6",
    orientation: "portrait-primary",
    categories: ["lifestyle", "utilities", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Scan one thing",
        short_name: "Scan one",
        description: "Start a single-Thing investigation",
        url: "/start?mode=single",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Scan a room",
        short_name: "Scan room",
        description: "Start a room inventory",
        url: "/start?mode=room",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
