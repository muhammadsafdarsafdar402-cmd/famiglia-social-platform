"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Home, Film, Users, Zap, Calendar, ShoppingBag, Grid, Tv, 
  MessageSquare, User, Search, Bell
} from "lucide-react"

const features = [
  {
    icon: <Home className="w-6 h-6 text-yellow-500" />,
    title: "Home Feed",
    desc: "Your main social hub. Post updates, stories, and see what your friends are up to.",
    color: "bg-yellow-50"
  },
  {
    icon: <Film className="w-6 h-6 text-red-500" />,
    title: "Shorts",
    desc: "Watch and share short-form vertical videos. Swipe through endless entertainment.",
    color: "bg-red-50"
  },
  {
    icon: <ShoppingBag className="w-6 h-6 text-blue-500" />,
    title: "Mall & Marketplace",
    desc: "Buy and sell products securely. Browse items or list your own for the community.",
    color: "bg-blue-50"
  },
  {
    icon: <Calendar className="w-6 h-6 text-purple-500" />,
    title: "Events",
    desc: "Find concerts, meetups, and parties. Buy tickets and check-in with QR codes.",
    color: "bg-purple-50"
  },
  {
    icon: <Users className="w-6 h-6 text-green-500" />,
    title: "Groups",
    desc: "Join communities based on your interests. Discuss topics and meet new people.",
    color: "bg-green-50"
  },
  {
    icon: <Tv className="w-6 h-6 text-pink-500" />,
    title: "TV Network",
    desc: "Watch exclusive long-form content, shows, and movies from the Golden Family.",
    color: "bg-pink-50"
  },
  {
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    title: "Live",
    desc: "Go live to your audience or watch real-time streams from other creators.",
    color: "bg-orange-50"
  },
  {
    icon: <Grid className="w-6 h-6 text-indigo-500" />,
    title: "Creator Suite",
    desc: "Professional tools for creators. Manage analytics, earnings, and content.",
    color: "bg-indigo-50"
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-zinc-500" />,
    title: "Messages",
    desc: "Private chats and group conversations. Make voice and video calls instantly.",
    color: "bg-zinc-50"
  }
]

export default function AppGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col p-0 bg-white rounded-3xl border-none">
        
        {/* Header Section */}
        <div className="p-8 bg-zinc-900 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10">
                <DialogTitle className="text-3xl font-serif font-bold mb-2 text-yellow-400">
                    Platform Guide
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-base">
                    Explore the Golden Family Creator Suite. Here is what you can do.
                </DialogDescription>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"/>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="group flex gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-yellow-200 hover:shadow-lg hover:shadow-yellow-100/50 transition-all duration-300 bg-white"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 mb-1">{item.title}</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Tips Section */}
            <div className="mt-8 pt-8 border-t border-zinc-100">
                <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Pro Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        <Search className="w-5 h-5 text-zinc-400"/>
                        <p className="text-xs text-zinc-600"><span className="font-bold">Global Search:</span> Use the top bar to find people, products, and events instantly.</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        <Bell className="w-5 h-5 text-zinc-400"/>
                        <p className="text-xs text-zinc-600"><span className="font-bold">Notifications:</span> Check the bell icon for orders, invites, and likes.</p>
                    </div>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}