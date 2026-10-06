import { Tv, PlayCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TvPassThrough() {
    return (
        <div className="w-full h-[80vh] flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">
            <div className="relative w-full max-w-4xl bg-zinc-900 rounded-[40px] overflow-hidden shadow-2xl border-4 border-yellow-500/20 group cursor-pointer">
                
                {/* Background Image Effect */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593784991095-a20506948430?q=80&w=2648&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-[600px] text-center p-8">
                    <div className="mb-6 p-4 bg-yellow-500 text-black rounded-full shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-pulse">
                        <Tv className="w-16 h-16" />
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight drop-shadow-2xl">
                        Famiglia Doro <span className="text-yellow-400">TV</span>
                    </h1>
                    
                    <p className="text-zinc-300 text-lg max-w-xl mb-10 leading-relaxed">
                        Stream exclusive shows, live events, and premium content from the Golden Family network.
                    </p>

                    <a 
                        href="https://famigliadorotv.com/home" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                    >
                        <Button className="h-16 px-10 text-xl font-bold bg-white text-black hover:bg-yellow-400 hover:text-black rounded-full shadow-xl transition-all hover:scale-105 gap-3">
                            <PlayCircle className="w-6 h-6" />
                            Watch Now
                            <ExternalLink className="w-5 h-5 opacity-50" />
                        </Button>
                    </a>
                    
                    <p className="mt-6 text-xs text-zinc-500 uppercase tracking-widest">Opens in a new tab</p>
                </div>
            </div>
        </div>
    )
}