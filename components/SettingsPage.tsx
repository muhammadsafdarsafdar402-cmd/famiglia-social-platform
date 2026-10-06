"use client"

import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EMOJI_PACKS } from '@/lib/emojiPacks' // Import the file we just made
import {  Smile, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase';

// --- NEW COMPONENT: EMOJI FREEDOM SETTINGS ---
function EmojiSettings({ session }: { session: any }) {
    const [activePack, setActivePack] = useState('classic')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('profiles').select('active_emoji_pack').eq('id', session.user.id).single()
            if (data?.active_emoji_pack && EMOJI_PACKS[data.active_emoji_pack]) {
                setActivePack(data.active_emoji_pack)
            }
        }
        load()
    }, [])

    const changePack = async (packId: string) => {
        setActivePack(packId)
        setLoading(true)
        await supabase.from('profiles').update({ active_emoji_pack: packId }).eq('id', session.user.id)
        setLoading(false)
        // Note: In a real app, you might use React Context to update the feed immediately without reload
    }

    const currentPackData = EMOJI_PACKS[activePack]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10">
            
            {/* HEADER */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl text-white shadow-lg">
                <h3 className="font-black text-2xl mb-2 flex items-center gap-2">
                    <Smile className="w-8 h-8"/> Freedom of Emojis
                </h3>
                <p className="text-white/90 text-sm font-medium">
                    Customize how you react to the world. Choose a pack that defines your style.
                </p>
            </div>

            {/* PACK SELECTOR GRID */}
            <div>
                <h4 className="font-bold text-zinc-900 mb-4 text-sm uppercase tracking-wider ml-1">Select Your Vibe</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(EMOJI_PACKS).map((pack) => (
                        <div 
                            key={pack.id} 
                            onClick={() => changePack(pack.id)}
                            className={`
                                cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200
                                ${activePack === pack.id 
                                    ? 'border-yellow-500 bg-yellow-50 shadow-md scale-[1.02]' 
                                    : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-zinc-900">{pack.name}</span>
                                {activePack === pack.id && <div className="bg-yellow-500 text-white rounded-full p-1"><Check className="w-3 h-3"/></div>}
                            </div>
                            <p className="text-xs text-zinc-500 mb-4 line-clamp-1">{pack.description}</p>
                            
                            {/* Preview Icons */}
                            <div className="flex gap-1">
                                {pack.emojis.slice(0, 5).map(e => (
                                    <span key={e.name} className="text-lg grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">{e.icon}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* GLOSSARY / MEANINGS LEGEND */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                    <Info className="w-5 h-5 text-zinc-400"/>
                    <div>
                        <h4 className="font-bold text-zinc-900 text-sm">Pack Meanings: {currentPackData.name}</h4>
                        <p className="text-xs text-zinc-400">What these symbols represent in this context.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                    {currentPackData.emojis.map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl border border-zinc-100/50 hover:border-zinc-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-zinc-100">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-900 text-sm">{item.name}</span>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-zinc-500 bg-white px-3 py-1 rounded-full border border-zinc-100 shadow-sm">
                                {item.meaning}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
// Common Internet Languages List
const LANGUAGES = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
    { code: 'pt', name: 'Português (Portuguese)', flag: '🇧🇷' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
]

export default function SettingsPage() {
    const { i18n, t } = useTranslation();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        // Optional: Handle RTL for Arabic
        document.dir = lng === 'ar' ? 'rtl' : 'ltr';
        setShowLangMenu(false);
    }

    if (showLangMenu) {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setShowLangMenu(false)} className="text-sm text-zinc-500 hover:text-black font-bold flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4"/> Back
                    </button>
                    <h2 className="text-xl font-bold">Select Language</h2>
                </div>
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 max-h-[70vh] overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 border-b border-zinc-50 last:border-none transition-colors"
                        >
                            <span className="flex items-center gap-3 text-lg">
                                <span className="text-2xl shadow-sm rounded-full">{lang.flag}</span> 
                                <span className="font-medium text-zinc-900">{lang.name}</span>
                            </span>
                            {i18n.language === lang.code && <Check className="w-5 h-5 text-yellow-500" />}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 p-2">
            <button 
                onClick={() => setShowLangMenu(true)} 
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <span className="text-xl">🌐</span>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-zinc-900">Language</p>
                        <p className="text-xs text-zinc-500">
                            {LANGUAGES.find(l => l.code === i18n.language)?.name || "Select Language"}
                        </p>
                    </div>
                </div>
                <span className="text-zinc-300">Change</span>
            </button>
        </div>
    )
}