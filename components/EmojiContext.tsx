"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EMOJI_PACKS, EmojiPack } from '@/lib/emojiPacks'

type EmojiContextType = {
    activePackId: string;
    currentPack: EmojiPack;
    allPacks: Record<string, EmojiPack>;
    setPack: (packId: string) => Promise<void>;
    refreshCustomPacks: () => Promise<void>;
}

const EmojiContext = createContext<EmojiContextType | undefined>(undefined)

export function EmojiProvider({ children }: { children: React.ReactNode }) {
    const [activePackId, setActivePackId] = useState('classic')
    const [customPacks, setCustomPacks] = useState<any[]>([])
    const [userId, setUserId] = useState<string | null>(null)

    // 1. Initialize User
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
                setUserId(data.session.user.id)
                loadUserData(data.session.user.id)
            }
        })
    }, [])

    // 2. Fetch Data Helper
    const loadUserData = async (uid: string) => {
        // Get Preference
        const { data: settings } = await supabase.from('user_settings').select('active_emoji_pack').eq('user_id', uid).single()
        if (settings?.active_emoji_pack) setActivePackId(settings.active_emoji_pack)

        // Get Custom Packs
        const { data: customs } = await supabase.from('custom_emoji_packs').select('*').eq('user_id', uid)
        if (customs) setCustomPacks(customs)
    }

    // 3. Action: Change Pack
    const setPack = async (packId: string) => {
        // OPTIMISTIC UPDATE (Updates UI Instantly)
        setActivePackId(packId)
        
        // Background DB Update
        if (userId) {
            await supabase.from('user_settings').upsert({ user_id: userId, active_emoji_pack: packId })
        }
    }

    // 4. Action: Refresh Custom Packs
    const refreshCustomPacks = async () => {
        if (userId) {
            const { data } = await supabase.from('custom_emoji_packs').select('*').eq('user_id', userId)
            if (data) setCustomPacks(data)
        }
    }

    // 5. Merge Data
    const allPacks: Record<string, EmojiPack> = { ...EMOJI_PACKS }
    
    customPacks.forEach(p => {
        allPacks[p.id] = {
            id: p.id,
            name: p.name,
            description: p.description || 'Custom Pack',
            emojis: p.emojis,
            level: 1 // <--- FIX: Added default level (1 = Free) to satisfy the type definition
        }
    })

    const currentPack = allPacks[activePackId] || allPacks['classic']

    return (
        <EmojiContext.Provider value={{ activePackId, currentPack, allPacks, setPack, refreshCustomPacks }}>
            {children}
        </EmojiContext.Provider>
    )
}

// Custom Hook to use the Context
export function useEmoji() {
    const context = useContext(EmojiContext)
    if (context === undefined) {
        throw new Error('useEmoji must be used within an EmojiProvider')
    }
    return context
}