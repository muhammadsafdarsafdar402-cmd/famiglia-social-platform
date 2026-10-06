"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Globe, Send, Share2, Check, Mail, MessageCircle, Twitter, Facebook, Linkedin, MoreHorizontal } from 'lucide-react'
import { Input } from "@/components/ui/input"

// 1. CUSTOM X ICON (For Twitter/X)
const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
)

// 2. UPDATED SOCIAL LINKS (Cleaner List)
const SOCIALS = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', text: 'text-white', url: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { id: 'twitter', name: 'X', icon: XIcon, color: 'bg-black', text: 'text-white', url: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', text: 'text-white', url: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0a66c2]', text: 'text-white', url: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-zinc-100', text: 'text-zinc-600', url: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}` },
]

export default function ShareDialog({ isOpen, onClose, session, item }: { isOpen: boolean, onClose: () => void, session: any, item: { type: string, data: any } | null }) {
    const [friends, setFriends] = useState<any[]>([])
    const [sentIds, setSentIds] = useState<Set<string>>(new Set())
    const [search, setSearch] = useState('')
    const [canNativeShare, setCanNativeShare] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setSentIds(new Set())
            setSearch('')
            setCopied(false)
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                setCanNativeShare(true)
            }
        }
    }, [isOpen, item])

    useEffect(() => {
        if (isOpen && session) {
            const fetchFriends = async () => {
                const myId = session.user.id
                const { data: rels } = await supabase.from('friends').select('user_a, user_b').or(`user_a.eq.${myId},user_b.eq.${myId}`)

                if (rels) {
                    const friendIds = rels.map(r => r.user_a === myId ? r.user_b : r.user_a)
                    if (friendIds.length > 0) {
                        const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds)
                        if (profiles) setFriends(profiles)
                    }
                }
            }
            fetchFriends()
        }
    }, [isOpen, session])

    if (!item) return null

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${item.type}/${item.data.id}` : ''
    const shareText = `Check out this ${item.type} on Famiglia Oro!`

    const handleSend = async (targetId: string | null) => {
        const stateKey = targetId || 'global'
        setSentIds(prev => new Set(prev).add(stateKey))

        const payload = {
            sender_id: session.user.id,
            receiver_id: targetId,
            content: `${shareText}: ${shareUrl}`,
            type: 'text'
        }

        const { error } = await supabase.from('messages').insert(payload)

        if (error) {
            console.error("Share failed:", error)
            setSentIds(prev => { const next = new Set(prev); next.delete(stateKey); return next; })
        }
    }

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: 'Famiglia Oro',
                text: shareText,
                url: shareUrl,
            })
            onClose()
        } catch (err) {
            console.log('Error sharing:', err)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const filteredFriends = friends.filter(f => f.username?.toLowerCase().includes(search.toLowerCase()))

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-white rounded-3xl border-zinc-100 p-0 overflow-hidden z-[11000] pointer-events-auto shadow-2xl">
                <DialogHeader className="p-5 pb-0 flex flex-row items-center justify-between border-b border-transparent">
                    <DialogTitle className="font-black text-xl flex items-center gap-2 text-zinc-900">
                        <div className="bg-yellow-100 p-2 rounded-full">
                            <Share2 className="w-5 h-5 text-yellow-600" />
                        </div>
                        Share {item.type}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="chat" className="w-full mt-2">
                    <TabsList className="w-full grid grid-cols-2 px-5 bg-transparent">
                        <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 rounded-xl py-2">Famiglia Chat</TabsTrigger>
                        <TabsTrigger value="social" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 rounded-xl py-2">Social Apps</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: INTERNAL FRIENDS */}
                    <TabsContent value="chat" className="p-0 animate-in fade-in slide-in-from-bottom-2 mt-2">
                        <div className="px-5 py-2">
                            <Input placeholder="Search friends..." className="bg-zinc-50 border-zinc-200 rounded-xl h-10" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="max-h-[320px] overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
                            <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors border border-transparent hover:border-zinc-100 group cursor-pointer" onClick={() => !sentIds.has('global') && handleSend(null)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200"><Globe className="w-5 h-5" /></div>
                                    <div className="text-left">
                                        <span className="font-bold text-sm block text-zinc-900">Global Chat</span>
                                        <span className="text-[10px] text-zinc-500 block">Share with everyone</span>
                                    </div>
                                </div>
                                <Button size="sm" className={`rounded-full h-8 px-4 text-xs font-bold transition-all ${sentIds.has('global') ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white'}`} onClick={(e) => { e.stopPropagation(); handleSend(null) }} disabled={sentIds.has('global')}>
                                    {sentIds.has('global') ? "Sent" : "Send"}
                                </Button>
                            </div>

                            {filteredFriends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors border border-transparent hover:border-zinc-100 group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-zinc-100"><AvatarImage src={friend.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                                        <span className="font-bold text-sm text-zinc-900">{friend.username}</span>
                                    </div>
                                    <Button size="sm" className={`rounded-full h-8 px-4 text-xs font-bold transition-all ${sentIds.has(friend.id) ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white'}`} onClick={() => handleSend(friend.id)} disabled={sentIds.has(friend.id)}>
                                        {sentIds.has(friend.id) ? "Sent" : "Send"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* TAB 2: EXTERNAL APPS (FIXED UI) */}
                    <TabsContent value="social" className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-2 mt-0">

                        {/* Native Share */}
                        {canNativeShare && (
                            <Button onClick={handleNativeShare} className="w-full p-2 h-12 bg-zinc-900 text-white hover:bg-black rounded-xl font-bold shadow-sm flex items-center justify-center gap-2">
                                <MoreHorizontal className="w-4 h-4" /> Share via System Option
                            </Button>
                        )}

                        {/* Social Icons Grid */}
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px bg-zinc-100 flex-1"></div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Share to</span>
                                <div className="h-px bg-zinc-100 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-5 gap-6 justify-items-center">                                {SOCIALS.map((app) => (
                                <a
                                    key={app.id}
                                    href={app.url(shareUrl, shareText)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 group p-2 hover:bg-zinc-50 rounded-xl transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${app.color} ${app.text} flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 group-active:scale-95 border border-black/5`}>
                                        <app.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-900">{app.name}</span>
                                </a>
                            ))}
                            </div>
                        </div>

                        {/* Copy Link Section */}
                        <div className="bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100 flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 text-xs text-zinc-500 font-mono truncate select-all bg-transparent outline-none">
                                {shareUrl}
                            </div>
                            <Button
                                size="sm"
                                onClick={handleCopy}
                                className={`h-9 px-4 rounded-xl transition-all font-bold ${copied ? 'bg-green-500 text-white' : 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100'}`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}