"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EMOJI_PACKS, EmojiPack } from '@/lib/emojiPacks' 

export function useEmojiSystem(userId: string | null, isVip: boolean) {
    const [activePackId, setActivePackId] = useState<string>('defaults')
    const [loading, setLoading] = useState(true)

    const allPacksArray = Object.values(EMOJI_PACKS)

    // Filter Logic
    const accessiblePacks = allPacksArray.filter(pack => {
        if (pack.level === 1) return true;
        if (pack.level === 2 && isVip) return true;
        return false;
    })

    const lockedPacks = allPacksArray.filter(pack => {
        return pack.level === 2 && !isVip;
    })

    // --- NEW: FUNCTION TO SAVE PREFERENCE TO DB ---
    const selectPack = async (packId: string) => {
        // 1. Optimistic Update (Immediate UI change)
        setActivePackId(packId)

        if (!userId) return

        // 2. Persist to Supabase
        const { error } = await supabase
            .from('user_settings')
            .upsert({ 
                user_id: userId, 
                active_emoji_pack: packId 
            }, { onConflict: 'user_id' })

        if (error) console.error("Failed to save emoji preference:", error)
    }

    // Fetch & Sync Logic
    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('user_settings')
                    .select('active_emoji_pack')
                    .eq('user_id', userId)
                    .single()

                if (data?.active_emoji_pack) {
                    const pack = EMOJI_PACKS[data.active_emoji_pack]
                    // Validate if user still has access (e.g. VIP check)
                    if (pack && (pack.level === 1 || (pack.level === 2 && isVip))) {
                        setActivePackId(data.active_emoji_pack)
                    } else {
                        setActivePackId('defaults') 
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()

        // Realtime Listener (Syncs across tabs/devices)
        const channel = supabase.channel('emoji_settings_realtime')
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'user_settings',
                    filter: `user_id=eq.${userId}` 
                }, 
                (payload) => {
                    if (payload.new?.active_emoji_pack) {
                        setActivePackId(payload.new.active_emoji_pack)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [userId, isVip])

    const currentPack = accessiblePacks.find(p => p.id === activePackId) || EMOJI_PACKS['defaults']

    return { 
        activePackId, 
        selectPack, // <--- EXPORT THIS
        accessiblePacks, 
        lockedPacks, 
        currentPack, 
        loading 
    }
}