// --- MOBILE NAVIGATION COMPONENT ---
import { Menu, MoreHorizontal, LayoutGrid, MessageSquare, Home, Film } from "lucide-react" // Import extra icons

function MobileNav({ 
    activeTab, 
    setActiveTab, 
    onOpenMenu, 
    onOpenWidgets 
}: { 
    activeTab: string, 
    setActiveTab: (t: string) => void, 
    onOpenMenu: () => void, 
    onOpenWidgets: () => void 
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 px-6 py-3 lg:hidden safe-area-bottom">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {/* 1. HOME */}
                <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 ${activeTab === 'feed' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    <Home className={`w-6 h-6 ${activeTab === 'feed' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                {/* 2. CHAT */}
                <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    <MessageSquare className={`w-6 h-6 ${activeTab === 'chat' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">Chat</span>
                </button>

                {/* 3. MENU (Left Sidebar Access) */}
                <button onClick={onOpenMenu} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-900">
                    <div className="w-12 h-12 -mt-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-zinc-50 shadow-sm">
                        <LayoutGrid className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-[10px] font-medium">Menu</span>
                </button>

                {/* 4. SHORTS */}
                <button onClick={() => setActiveTab('shorts')} className={`flex flex-col items-center gap-1 ${activeTab === 'shorts' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    <Film className={`w-6 h-6 ${activeTab === 'shorts' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-medium">Shorts</span>
                </button>

                {/* 5. WIDGETS (Right Sidebar Access) */}
                <button onClick={onOpenWidgets} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-900">
                    <MoreHorizontal className="w-6 h-6" />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>
        </div>
    )
}