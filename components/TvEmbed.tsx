import { ExternalLink, Tv, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TvEmbed() {
    return (
        <div className="w-full h-[85vh] flex flex-col animate-in zoom-in-95 duration-500">
            
            {/* Header Control Bar */}
            <div className="bg-zinc-900 text-white p-4 rounded-t-3xl flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500 rounded-lg text-black">
                        <Tv className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Famiglia Doro TV</h3>
                        <p className="text-xs text-zinc-400">Live Broadcast</p>
                    </div>
                </div>
                <a href="https://famigliadorotv.com/home" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-white text-black hover:bg-yellow-400 hover:text-black font-bold gap-2">
                        <Maximize2 className="w-4 h-4" /> Open Full Site
                    </Button>
                </a>
            </div>

            {/* The Actual Website Embed */}
            <div className="relative flex-1 bg-black rounded-b-3xl overflow-hidden border-x border-b border-zinc-200 shadow-2xl">
                <iframe 
                    src="https://famigliadorotv.com/home" 
                    className="w-full h-full border-0"
                    title="Famiglia Doro TV"
                    allowFullScreen
                    // These permissions ensure the site works correctly inside the box
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
        </div>
    )
}