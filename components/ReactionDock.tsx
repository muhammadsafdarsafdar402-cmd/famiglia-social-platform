"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smile, ThumbsUp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// Ensure this import path matches where you saved your types
import { EmojiItem, EmojiPack } from '@/lib/emojiPacks' 

interface ReactionDockProps {
    onReact: (emoji: string) => void
    variant?: 'inline' | 'floating'
    activePack?: EmojiPack 
    currentReaction?: string | null
}

// --- HELPER: Renders either an <img> or <span> based on isCustomImage ---
const EmojiRenderer = ({ item }: { item: EmojiItem }) => {
    if (item.isCustomImage) {
        return (
            <img 
                src={item.icon} 
                alt={item.name} 
                className="w-8 h-8 object-contain hover:scale-125 transition-transform duration-200" 
            />
        )
    }
    // Fallback for standard text emojis
    return <span className="text-2xl hover:scale-125 transition-transform duration-200 cursor-default">{item.icon}</span>
}

export default function ReactionDock({ 
    onReact, 
    variant = 'inline', 
    currentReaction = null,
    activePack 
}: ReactionDockProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Safety fallback
    const packToRender = activePack || { id: 'loading', name: 'Loading...', description: '', level: 1, emojis: [] }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button 
                    className={`
                        group flex items-center gap-2 transition-colors font-medium text-sm
                        ${variant === 'floating' ? 'bg-white/90 backdrop-blur shadow-lg px-4 py-2 rounded-full' : ''}
                        ${currentReaction ? 'text-blue-600' : 'text-zinc-500 hover:text-yellow-600'}
                    `}
                >
                    {/* --- FIXED: ICON LOGIC FOR TRIGGER --- */}
                    {currentReaction ? (
                        // Check if the reaction string is a file path (starts with /) or URL
                        (currentReaction.startsWith('/') || currentReaction.startsWith('http')) ? (
                            <img 
                                src={currentReaction} 
                                alt="reaction" 
                                className="w-5 h-5 object-contain" 
                            />
                        ) : (
                            <span className="text-xl scale-110">{currentReaction}</span>
                        )
                    ) : (
                        <ThumbsUp className={`w-5 h-5 ${isOpen ? 'text-yellow-500 fill-current' : ''}`} />
                    )}
                    
                    {/* TEXT LOGIC */}
                    <span className={currentReaction ? "font-bold" : ""}>
                        {currentReaction ? 'Reacted' : (packToRender.id === 'classic' ? 'Like' : 'React')}
                    </span>
                </button>
            </PopoverTrigger>
            
            <PopoverContent 
                side="top" 
                align="start" 
                className="w-80 p-0 bg-white shadow-2xl border border-zinc-200 rounded-2xl overflow-hidden z-50"
            >
                {/* Header */}
                <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                    <span>{packToRender.name} Pack</span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-6 gap-2 p-3 max-h-[280px] overflow-y-auto overflow-x-clip custom-scrollbar">
                    {packToRender.emojis.map((item, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            onClick={() => {
                                onReact(item.icon); // Pass the icon path string up
                                setIsOpen(false);
                            }}
                            className={`
                                relative group w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all
                                ${currentReaction === item.icon ? 'bg-yellow-100 border-2 border-yellow-400 scale-110' : 'hover:bg-zinc-100 hover:scale-110'}
                            `}
                        >
                            {/* --- FIXED: USE THE RENDERER COMPONENT HERE --- */}
                            <EmojiRenderer item={item} />
                            
                            {/* Tooltip */}
                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                {item.name}: <span className="opacity-70">{item.meaning}</span>
                            </span>
                        </motion.button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}