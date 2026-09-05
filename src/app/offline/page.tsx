import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function OfflinePage() {
  return <main className="grid min-h-screen place-items-center p-6"><div className="paper-card max-w-md rounded-[36px] p-8 text-center"><Logo className="justify-center" /><span className="mx-auto mt-10 grid size-20 place-items-center rounded-full bg-purple/10 text-purple"><WifiOff className="size-9" /></span><h1 className="mt-6 text-3xl font-black tracking-[-.05em]">You’re offline, Kaki.</h1><p className="mt-3 leading-7 text-muted">Your saved missions are still on this device. Reconnect to create or update a mission.</p><ButtonLink href="/home" className="mt-7 w-full">Back to home</ButtonLink></div></main>;
}
