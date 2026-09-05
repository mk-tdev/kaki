import type { Metadata } from "next";
import QRCode from "qrcode";
import { PresentationDeck } from "@/components/presentation-deck";

export const metadata: Metadata = {
  title: "KAKI presentation",
  description: "How AI can activate intergenerational neighbour connections in Pek Kio.",
};

export default async function PresentationPage() {
  const qrCode = await QRCode.toDataURL("https://kaki-dun.vercel.app", {
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#211D35", light: "#FFFDF7" },
  });
  return <PresentationDeck qrCode={qrCode} />;
}
