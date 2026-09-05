import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAKI — One real neighbour",
    short_name: "KAKI",
    description: "Turn small needs into meaningful neighbour moments in Pek Kio.",
    start_url: "/home",
    display: "standalone",
    background_color: "#FFF8E8",
    theme_color: "#6D55D9",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
