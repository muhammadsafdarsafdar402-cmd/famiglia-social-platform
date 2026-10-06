"use client"

import { useState } from "react"
import { Check, ShieldCheck, X } from "lucide-react"
// 1. ADD DialogTitle TO IMPORTS
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import PaymentModal from "./PaymentModal" 

// --- CLEANED PLANS CONFIGURATION ---
const PLANS = [
    {
        name: "Free Trial",
        price: "0.00",
        duration: "90 Days",
        features: [
            "Global Mall Seller", 
            "Business Page Creation", 
            "Create Private Group", 
            "Freedom of Emoji (Level 2)"
        ],
        color: "bg-zinc-900 text-white",
        tierId: "free_trial",
        badgeImg: '/badges/free.png' 
    },
    {
        name: "Verified Mid Student",
        price: "0.99",
        duration: "/mo",
        features: [
            "Global Mall Seller", 
            "Freedom of Emoji", 
            "Limited Hub Access"
        ],
        color: "bg-orange-400 text-white",
        tierId: "mid_student",
        badgeImg: "/badges/badge1.png" 
    },
    {
        name: "Verified HS Student",
        price: "1.99",
        duration: "/mo",
        features: [
            "Global Mall Seller", 
            "Freedom of Speech", 
            "Limited Hub Access"
        ],
        color: "bg-zinc-300 text-zinc-900",
        tierId: "hs_student",
        badgeImg: "/badges/badge2.png"
    },
    {
        name: "Verified College Student",
        price: "2.99",
        duration: "/mo",
        features: [
            "Create Private Group", 
            "Global Mall Seller", 
            "Business Page Creation",
            "Freedom of Emoji", 
            "Some SuiteHub Access"
        ],
        color: "bg-yellow-400 text-black",
        tierId: "college_student",
        badgeImg: "/badges/badge3.png"
    },
    {
        name: "Verified User",
        price: "3.99",
        duration: "/mo",
        features: [
            "Global Mall Seller", 
            "Business Page Creation", 
            "Create Private Group", 
            "Freedom of Emoji (Level 2)", 
            "Some SuiteHub Access"
        ],
        color: "bg-zinc-800 text-white border border-yellow-500/50",
        tierId: "verified_user",
        badgeImg: "/badges/badge4.png"
    },
    {
        name: "Verified Seller",
        price: "5.99",
        duration: "/mo",
        features: [
 "Global Mall Seller", 
            "Business Page Creation", 
            "Create Private Group", 
            "Freedom of Emoji (Level 2)", 
            "Some SuiteHub Access",
                        "Go Live Feature"
        ],
        color: "bg-red-600 text-white",
        tierId: "verified_live",
        badgeImg: "/badges/badge5.png"
    },
        {
        name: "Verified Educator",
        price: "9.99",
        duration: "/mo",
        features: [
 "Global Mall Seller", 
            "Business Page Creation", 
           "Freedom of Emoji", 
            "Some SuiteHub Access",
        ],
        color: "bg-red-600 text-white",
        tierId: "verified_live",
        badgeImg: "/badges/badge8.png"
    },
    {
        name: "Community Partner",
        price: "8.99",
        duration: "/mo",
        features: [
"Global Mall Seller", 
            "Business Page Creation", 
            "Create Private Group", 
            "Freedom of Emoji (Level 2)", 
            "Some SuiteHub Access",
                        "Go Live Feature",
                                    "Content Upload"
        ],
        color: "bg-purple-600 text-white",
        tierId: "content_creator",
        badgeImg: "/badges/badge6.png"
    },
    {
        name: "Verified Artist",
        price: "9.99",
        duration: "/mo",
        features: [
            "Content Upload",
            "Create Private Group", 
            "Global Mall Seller",
            "Business Page Creation",
            "Freedom of Emoji", 
            "Freedom of Emoji (Level 2)", 
            "Some SuitHub Feature"

        ],
        color: "bg-pink-500 text-white",
        tierId: "verified_artist",
        badgeImg: "/badges/badge7.png"
    },
    {
        name: "Content Upload Badge",
        price: "24.99",
        duration: "/mo",
        features: [
            "Private Groups & Mall Seller",
            "Business Page Creation",
            "Freedom of Emoji (Level 2)",
            "Some SuiteHub Features",
            "Content Upload",
            "Go Live"
        ],
        color: "bg-indigo-600 text-white",
        tierId: "content_upload_badge",
        badgeImg: "/badges/badge6.png"
    },
    {
        name: "Business Startup",
        price: "24.99",
        duration: "/mo",
        features: [
            "Same as Content Upload Badge",
            "NO Content Upload Feature" 
        ],
        color: "bg-blue-800 text-white",
        tierId: "business_startup",
        badgeImg: "/badges/badge9.png"
    },
        {
        name: "Business Plus",
        price: "39.99",
        duration: "/mo",
        features: [
             "Content Upload",
            "Global Mall Seler",
            "Business Page Creation",
            "Create Private Group Access",
            "Freedom of emoji speech"           ,
            "Freedom of emoji speech level 2",
            "All Access to Suite Hub (+) Grandfathered in",
            "Go Live"
        ],
        color: "bg-emerald-600 text-white",
        tierId: "suitehub_access",
        badgeImg: "/badges/badge11.png"
    }, 
    {
        name: "Business LifeTime",
        price: "39.99",
        duration: "/mo",
        features: [
             "Content Upload",
            "Global Mall Seler",
            "Business Page Creation",
            "Create Private Group Access",
            "Freedom of emoji speech"           ,
            "Freedom of emoji speech level 2",
            "All Access to Suite Hub (+) Grandfathered in",
            "Go Live"
        ],
        color: "bg-emerald-600 text-white",
        tierId: "suitehub_access",
        badgeImg: "/badges/badge11.png"
    },
    {
        name: "Monetize ",
        price: "49.99",
        duration: "/mo",
        features: [
           "Content Upload",
            "Global Mall Seler",
            "Business Page Creation",
            "Create Private Group Access",
            "Freedom of emoji speech"
            ,
            "Freedom of emoji speech level 2",
            "All Access of Suit Hub +Go Live"
 
        ],
        color: "bg-gray-800 text-white",
        tierId: "all_no_live",
        badgeImg: "/badges/badge12.png"
    },
    {
        name: "Investor",
        price: "99.99",
        duration: "/mo",
        features: [
            "Content Upload",
            "Global Mall Seler",
            "Business Page Creation",
            "Create Private Group Access",
            "Freedom of emoji speech"
            ,
            "Freedom of emoji speech level 2",
            "Go Live"

        ],
        color: "bg-black text-yellow-400 border border-yellow-400",
        tierId: "ultimate_no_suite",
        badgeImg: "/badges/badge14.png"
    }
]

export default function SubscriptionPlans({ isOpen, onClose, session }: { isOpen: boolean, onClose: () => void, session: any }) {
    const [selectedPlan, setSelectedPlan] = useState<any>(null)

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl h-[80vh] p-0 border-none bg-zinc-50 rounded-3xl overflow-hidden flex flex-col">
                    <div className="bg-white p-6 text-center border-b border-zinc-100 relative shrink-0">
                        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-black"><X className="w-6 h-6" /></button>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-3 relative">
                            <ShieldCheck className="w-8 h-8 text-yellow-600" />
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white"><Check className="w-3 h-3" /></div>
                        </div>
                        
                        {/* 2. REPLACED h2 WITH DialogTitle */}
                        <DialogTitle className="text-2xl font-black text-zinc-900">
                            Get Verified
                        </DialogTitle>
                        
                        <p className="text-sm text-zinc-500 mt-1">Select a badge to unlock exclusive creator tools</p>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-zinc-100/50">
                        <div className="flex gap-4 h-full items-stretch pb-4"> 
                            {PLANS.map((plan) => (
                                <div 
                                    key={plan.name} 
                                    onClick={() => setSelectedPlan(plan)} 
                                    className={`relative group p-5 rounded-3xl min-w-[320px] w-[320px] flex flex-col transition-all hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-xl border border-transparent hover:border-black/5 ${plan.color}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            {plan.badgeImg ? (
                                                <img 
                                                    src={plan.badgeImg} 
                                                    alt="Badge" 
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm bg-white"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                                                    <ShieldCheck className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black tracking-tight">${plan.price}</div>
                                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">{plan.duration}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h3 className="font-bold text-xl leading-tight mb-1">{plan.name}</h3>
                                        <div className="h-1 w-10 bg-white/30 rounded-full"></div>
                                    </div>

                                    <ul className="space-y-2 pl-1 flex-1 overflow-y-auto custom-scrollbar">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="text-xs flex items-start gap-2 opacity-90 font-medium">
                                                <div className="mt-0.5 min-w-[14px] h-[14px] rounded-full bg-white/20 flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" /> 
                                                </div>
                                                <span className="leading-snug">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors">
                                            Select Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedPlan && (
                <PaymentModal 
                    isOpen={!!selectedPlan} 
                    onClose={() => setSelectedPlan(null)} 
                    plan={selectedPlan} 
                    session={session} 
                />
            )}
        </>
    )
}