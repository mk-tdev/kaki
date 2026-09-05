import type { Metadata } from "next";
import { LiveBloomWall } from "@/components/live-bloom-wall";
export const metadata:Metadata={title:"The kampung is blooming",description:"Live community moments, shared only with both participants’ consent."};
export default function LivePage(){return <LiveBloomWall/>;}
