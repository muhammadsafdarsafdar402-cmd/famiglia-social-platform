"use client"

import { useState, useEffect } from "react"
import { Search, Lock, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import SubscriptionPlans from "./SubscriptionPlan"

// --- 1. STRICT TIER MAPPING ---
// Maps the 'tierId' from the database to a numeric Access Level
const TIER_LEVELS: Record<string, number> = {
    // Basic / Free
    'free_trial': 1,

    // Students (Progressive Access)
    'mid_student': 2,
    'hs_student': 3,
    'college_student': 4,

    // Verified / Mid-Range (Standard Access)
    'verified_user': 5,
    'verified_live': 5,       // Live feature, but Hub access remains standard
    'content_creator': 5,     // Content feature, but Hub access remains standard
    'verified_artist': 5,
    'private_group_pro': 5,
    
    // Higher Access (Some extra features)
    'content_upload_badge': 6, 
    'business_startup': 6,

    // --- UNLOCKED (All Access) ---
    'suitehub_access': 100,     // $39.99 - Explicitly buys Hub Access
    'full_suite_access': 100,   // $39.99 - Explicitly buys Hub Access
    'all_no_live': 100,         // $49.99 - Includes All Hub

    // --- RESTRICTED (Explicitly NO Hub Access) ---
    'content_no_hub': 1,        // $29.99 - High price, but NO Hub
    'ultimate_no_hub': 1        // $99.99 - Highest price, but NO Hub
}

const SUITE_APPS = [
    // FREE (Tier 1)
    {
        name: "Canva",
        icon: <img src="/icons/menu_canva.png" alt="Canva" className="w-14 h-14 object-contain" />,
        color: "bg-white", 
        url: "https://canva.com",
        embed: true,
        minTier: 2
    },
    { name: "Duo",
        icon: <img src="/icons/menu_duo.png" alt="Duo" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "https://duo.com", embed: true, minTier: 2 
        },
    
         { name: "Meet", 
        icon: <img src="/icons/menu_meet.png" alt="Meet" className="w-12 h-12 object-contain" />,
        color: "bg-white border border-yellow-500", url: "https://www.Meet.com", embed: true, minTier: 2 },
    { name: "Adobe",
        icon: <img src="/icons/menu_3.png" alt="Adobe" className="w-8 h-8 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 2 },

    // MID STUDENT (Tier 2)
    { name: "1",
        icon: <img src="/icons/menu_4.png" alt="Canva" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "https://www.canva.com", embed: true, minTier: 2 },
    { name: "2", 
        icon: <img src="/icons/menu-5.png" alt="Zoom" className="w-12 h-12 object-contain" />,
        color: "bg-white", url: "https://zoom.us", embed: true, minTier: 2 },

    // HS STUDENT (Tier 3)
    { name: "3", 
        icon: <img src="/icons/menu_7.png" alt="menu_7" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "https://www.adobe.com", embed: false, minTier: 3 },
    { name: "4",
        icon: <img src="/icons/menu_8.png" alt="menu_8" className="w-12 h-12 object-contain" />,
         color: "bg-white text-black", url: "#", embed: false, minTier: 3 },

    // COLLEGE (Tier 4)
    { name: "6", 
        icon: <img src="/icons/menu_10.png" alt="menu_10" className="w-12 h-12 object-contain" />,
         color: "bg-white text-black", url: "#", embed: false, minTier: 4 },

    // VERIFIED (Tier 5)
    { name: "7", 
        icon: <img src="/icons/menu_11.png" alt="menu_11" className="w-12 h-12 object-contain" />,
        color: "bg-white text-black", url: "#", embed: false, minTier: 5 },
    { name: "8", 
        icon: <img src="/icons/menu_12.png" alt="menu_12" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "#", embed: false, minTier: 5 },
    { name: "9",
        icon: <img src="/icons/menu_13.png" alt="menu_13?" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "https://famigliadorotv.com", embed: true, minTier: 5 },
    { name: "10",
        icon: <img src="/icons/menu_14.png" alt="menu_14" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "#", embed: true, minTier: 5 },

    // EXTRAS (Mostly Tier 5+)
    { name: "11",
        icon: <img src="/icons/menu_15.png" alt="menu_15" className="w-12 h-12 object-contain" />,
           color: "bg-white", url: "#", embed: true, minTier: 5 },
    { name: "12",
        icon: <img src="/icons/menu_16.png" alt="menu_16" className="w-12 h-12 object-contain" />,
          color: "bg-white text-black border border-zinc-200", url: "#", embed: false, minTier: 5 },
    { name: "13",
        icon: <img src="/icons/menu_17.png" alt="menu_17" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "#", embed: true, minTier: 5 },
    { name: "14", 
        icon: <img src="/icons/menu_18.png" alt="menu_18" className="w-12 h-12 object-contain" />,
         color: "bg-white", url: "#", embed: true, minTier: 5 },
    { name: "15",
        icon: <img src="/icons/menu_19.png" alt="menu_19" className="w-12 h-12 object-contain" />,
          color: "bg-white text-black", url: "#", embed: true, minTier: 5 },
    { name: "16", 
        icon: <img src="/icons/menu_20.png"alt="menu_20" className="w-12 h-12 object-contain" />,
         color: "bg-white text-black border border-zinc-200", url: "#", embed: true, minTier: 5 },
    { name: "17",
        icon: <img src="/icons/menu_21.png" alt="menu_21" className="w-12 h-12 object-contain" />,
          color: "bg-black border border-yellow-500", url: "#", embed: true, minTier: 5 },
    { name: "18",
        icon: <img src="/icons/menu_22.png"alt="menu_22" className="w-12 h-12 object-contain" />,
          color: "bg-white text-black border border-zinc-200", url: "#", embed: true, minTier: 5 },
    { name: "19",
        icon: <img src="/icons/menu_23.png" alt="menu_23" className="w-12 h-12 object-contain" />,
          color: "bg-white border border-yellow-500", url: "#", embed: true, minTier: 5 },
    { name: "20",
        icon: <img src="/icons/menu_24.png" alt="menu_24" className="w-12 h-12 object-contain" />,
          color: "bg-white text-black border border-zinc-200", url: "#", embed: true, minTier: 5 },
    { name: "21",
        icon: <img src="/icons/menu_25.png" alt="menu_25" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
    { name: "22",
        icon: <img src="/icons/menu_26.png" alt="menu_26" className="w-12 h-12 object-contain" />,
          color: "bg-white text-black border border-zinc-200", url: "#", embed: true, minTier: 5 },
    { name: "23",
        icon: <img src="/icons/menu_27.png" alt="menu_27" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
          { name: "24",
        icon: <img src="/icons/menu_28.png" alt="menu_28" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
{ name: "25",
        icon: <img src="/icons/menu_29.png" alt="menu_29" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
{ name: "26",
        icon: <img src="/icons/menu_30.jpeg" alt="menu_30" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
{ name: "27",
        icon: <img src="/icons/menu_31.jpeg" alt="menu_31" className="w-12 h-12 object-contain" />,
          color: "bg-white", url: "#", embed: true, minTier: 5 },
]

export default function SuiteHub({ session }: { session: any }) {
    const [selectedApp, setSelectedApp] = useState<any>(null)
    const [showPlans, setShowPlans] = useState(false)
    const [search, setSearch] = useState("")
    const [userTierLevel, setUserTierLevel] = useState(1) // Default to Level 1

    useEffect(() => {
        const fetchTier = async () => {
            if (!session?.user) return
            const { data } = await supabase.from('profiles').select('verified_tier').eq('id', session.user.id).single()
            
            // Map the string tier ID from DB to the number Level
            if (data?.verified_tier) {
                const level = TIER_LEVELS[data.verified_tier] || 1
                setUserTierLevel(level)
            } else {
                setUserTierLevel(1)
            }
        }
        fetchTier()
    }, [session])

    const handleAppClick = (app: any) => {
        // --- ACCESS LOGIC ---
        // If user level is lower than app requirement, LOCK IT.
        if (userTierLevel < app.minTier) {
            alert(`🔒 Locked: Upgrade to Level ${app.minTier} to access.`)
            setShowPlans(true)
            return
        }
        
        if (app.embed) setSelectedApp(app)
        else window.open(app.url, '_blank')
    }

    const filteredApps = SUITE_APPS.filter(app => app.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 pb-20 px-2 md:px-0">
            {/* --- HEADER --- */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-center text-white shadow-2xl border border-zinc-800">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
                            Creator Suite <span className="bg-zinc-800 text-sm px-2 py-1 rounded-lg text-zinc-400 font-medium">Access Level {userTierLevel}</span>
                        </h2>
                        <p className="text-zinc-400 text-sm max-w-md">Upgrade your badge to unlock premium tools.</p>
                    </div>

                    <Button
                        onClick={() => setShowPlans(true)}
                        className="h-14 px-8 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold text-lg rounded-2xl shadow-lg shadow-yellow-500/20 transform hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-6 h-6" /> Get Verified
                    </Button>
                </div>
            </div>

            {/* --- SEARCH --- */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input placeholder="Search Apps..." className="pl-10 h-12 rounded-2xl bg-white border-zinc-200" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* --- GRID --- */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                {filteredApps.map((app) => {
                    const isLocked = userTierLevel < app.minTier;
                    return (
                        <div key={app.name} onClick={() => handleAppClick(app)} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                            <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${app.color} ${isLocked ? 'opacity-40 grayscale' : ''} `}>
                                {app.icon}
                                {isLocked && <div className="absolute -top-1 -right-1 bg-zinc-900 text-yellow-500 rounded-full p-1 border-2 border-white"><Lock className="w-3 h-3" /></div>}
                            </div>
                        </div>
                    )
                })}
            </div>

            <SubscriptionPlans isOpen={showPlans} onClose={() => setShowPlans(false)} session={session} />

            {/* --- INTERNAL VIEWER --- */}
            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-6xl h-[90vh] p-0 border-none bg-black flex flex-col overflow-hidden rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between p-4 bg-zinc-900 text-white border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${selectedApp?.color}`}>{selectedApp?.icon}</div>
                            <h3 className="font-bold">{selectedApp?.name}</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedApp(null)}><X className="w-5 h-5" /></Button>
                        </div>
                    </div>
                    <div className="flex-1 bg-white relative">
                        {selectedApp && <iframe src={selectedApp.url} className="w-full h-full border-0" title={selectedApp.name} allow="camera; microphone; geolocation; fullscreen" />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}