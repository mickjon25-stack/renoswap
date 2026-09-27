import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RenoSwap",
    short_name: "RenoSwap",
    description:
      "Texas-first marketplace for renovation leftovers. Swap first; sell when it helps.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1faab6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
