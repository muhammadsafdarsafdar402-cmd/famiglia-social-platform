"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next' // <--- IMPORT THIS
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Send, Image as ImageIcon, MoreVertical, Phone, Video, Loader2, Globe, Users, MessageCircle, X } from 'lucide-react'

// --- HELPER: DETECT LINKS IN TEXT ---
const FormattedMessage = ({ text, isMe, onNavigate }: { text: string, isMe: boolean, onNavigate: (type: string, id: string) => void }) => {
    if (!text) return null;
    const urlRegex = /((?:https?:\/\/)[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
        <span className="whitespace-pre-wrap break-words">
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    const isInternal = typeof window !== 'undefined' && part.startsWith(window.location.origin);
                    return (
                        <a key={i} href={part} target={isInternal ? undefined : "_blank"} rel="noopener noreferrer" 
                            onClick={(e) => {
                                if (isInternal) {
                                    e.preventDefault(); e.stopPropagation();
                                    const path = part.replace(window.location.origin + '/', '');
                                    const [type, id] = path.split('/');
                                    if (type && id) onNavigate(type, id);
                                } else e.stopPropagation();
                            }}
                            className={`underline font-bold hover:opacity-70 transition-opacity cursor-pointer ${isMe ? 'text-white decoration-white/50' : 'text-blue-600 decoration-blue-300'}`}>
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

// --- SHARED: THREAD LIST ITEM ---
const ThreadItem = ({ item, active, onClick, icon: Icon }: any) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all rounded-2xl mx-2 mb-1 group ${active ? 'bg-yellow-50 border border-yellow-200 shadow-sm' : 'hover:bg-zinc-50 border border-transparent'}`}>
        <div className="relative">
            <Avatar className="h-12 w-12 border border-zinc-200 bg-white">
                {item.image ? <AvatarImage src={item.image} className="object-cover" /> : null}
                <AvatarFallback className={`${active ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-500'} font-bold`}>{item.name?.[0]?.toUpperCase() || <Icon className="w-5 h-5"/>}</AvatarFallback>
            </Avatar>
            {item.isFriend && <span className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full"><div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div></span>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5"><span className={`text-sm font-bold truncate ${active ? 'text-zinc-900' : 'text-zinc-700'}`}>{item.name}</span>{item.time && <span className="text-[10px] text-zinc-400">{item.time}</span>}</div>
            <p className={`text-xs truncate ${active ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>{item.lastMsg}</p>
        </div>
    </div>
)

type ChatDashboardProps = {
    session: any;
    onCall: (target: any, isVideo: boolean) => void;
    onNavigate: (type: string, id: string) => void;
}

export default function ChatDashboard({ session, onCall, onNavigate }: ChatDashboardProps) {
    const [activeTab, setActiveTab] = useState("direct")
    const [activeThread, setActiveThread] = useState<any>(null)
    const [directThreads, setDirectThreads] = useState<any[]>([])
    const [groupThreads, setGroupThreads] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null) // New State for Lightbox
    const { t } = useTranslation()
    // Refs
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null) // New Ref for File Upload
// 1. INITIAL FETCH (FRIENDS + MESSAGES)
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            const myId = session.user.id

            // A. Fetch Friends
            const { data: friendsRel } = await supabase.from('friends').select('user_a, user_b').or(`user_a.eq.${myId},user_b.eq.${myId}`)
            const friendIds = new Set<string>()
            friendsRel?.forEach(f => friendIds.add(f.user_a === myId ? f.user_b : f.user_a))

            // B. Fetch Active Chats
            // FIX: Added 'media_url' to the select statement below
            const { data: msgs } = await supabase.from('messages')
                .select('sender_id, receiver_id, content, created_at, media_url') 
                .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
                .is('group_id', null)
                .order('created_at', { ascending: false })
                .limit(300)

            const chatHistory = new Map()
            msgs?.forEach((m: any) => { // Added :any to suppress strict type checking on the loop variable if needed
                const partnerId = m.sender_id === myId ? m.receiver_id : m.sender_id
                if (partnerId && !chatHistory.has(partnerId)) {
                    // Now media_url exists on 'm'
                    const previewText = m.content || (m.media_url ? "Sent an attachment" : "Message")
                    chatHistory.set(partnerId, { 
                        lastMsg: previewText, 
                        time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    })
                }
            })

            // C. Merge Lists
            const allUserIds = new Set([...Array.from(friendIds), ...Array.from(chatHistory.keys())])
            
            if (allUserIds.size > 0) {
                const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', Array.from(allUserIds))
                if (profiles) {
                    const threads = profiles.map(p => {
                        const history = chatHistory.get(p.id)
                        const isFriend = friendIds.has(p.id)
                        return { 
                            id: p.id, 
                            name: p.username, 
                            image: p.avatar_url, 
                            type: 'direct', 
                            isFriend: isFriend, 
                            lastMsg: history ? history.lastMsg : "Start a conversation", 
                            time: history ? history.time : null 
                        }
                    })
                    threads.sort((a, b) => { if (a.time && !b.time) return -1; if (!a.time && b.time) return 1; return 0; })
                    setDirectThreads(threads)
                }
            }

            // D. Fetch Groups
            const { data: groups } = await supabase.from('groups').select('*')
            if (groups) {
                setGroupThreads(groups.map(g => ({ id: g.id, name: g.name, image: g.image_url, type: 'group', lastMsg: 'Community Chat' })))
            }
            setLoading(false)
        }
        loadData()
    }, [session.user.id])

    useEffect(() => {
        if (!activeThread) return
        setMessages([])
        const fetchMessages = async () => {
            let query = supabase.from('messages').select('*, profiles:sender_id(username, avatar_url)').order('created_at', { ascending: true })
            if (activeThread.type === 'direct') query = query.or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeThread.id}),and(sender_id.eq.${activeThread.id},receiver_id.eq.${session.user.id})`)
            else if (activeThread.type === 'group') query = query.eq('group_id', activeThread.id)
            else if (activeThread.type === 'global') query = query.is('receiver_id', null).is('group_id', null)
            const { data } = await query
            if (data) setMessages(data)
            scrollToBottom()
        }
        fetchMessages()
        const channelId = activeThread.type === 'group' ? `group_${activeThread.id}` : activeThread.type === 'global' ? 'global_chat' : `chat_${activeThread.id}`
        const channel = supabase.channel(channelId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const m = payload.new
                let isMatch = false
                if (activeThread.type === 'direct' && ((m.sender_id === activeThread.id && m.receiver_id === session.user.id) || (m.sender_id === session.user.id && m.receiver_id === activeThread.id))) isMatch = true
                else if (activeThread.type === 'group' && m.group_id === activeThread.id) isMatch = true
                else if (activeThread.type === 'global' && !m.receiver_id && !m.group_id) isMatch = true
                if (isMatch) {
                    const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', m.sender_id).single()
                    setMessages(prev => [...prev, { ...m, profiles: profile }])
                    scrollToBottom()
                }
            }).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [activeThread])

    const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeThread) return
        const payload = { content: newMessage, sender_id: session.user.id, receiver_id: activeThread.type === 'direct' ? activeThread.id : null, group_id: activeThread.type === 'group' ? activeThread.id : null }
        const tempMsg = { id: Date.now(), content: newMessage, sender_id: session.user.id, profiles: { username: 'Me', avatar_url: session.user.user_metadata.avatar_url } }
        setMessages(prev => [...prev, tempMsg])
        setNewMessage('')
        scrollToBottom()
        await supabase.from('messages').insert(payload)
    }

    // --- NEW: HANDLE FILE UPLOAD ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file || !activeThread) return
        
        // Optimistic UI for Image
        const tempUrl = URL.createObjectURL(file)
        const tempMsg = { 
            id: Date.now(), 
            content: "Sent an attachment", 
            media_url: tempUrl, // Show immediately
            sender_id: session.user.id, 
            profiles: { username: 'Me', avatar_url: session.user.user_metadata.avatar_url } 
        }
        setMessages(prev => [...prev, tempMsg])
        scrollToBottom()

        // Upload to Bucket
        const fileName = `chat/${Date.now()}_${file.name.replace(/\s/g, '')}`
        await supabase.storage.from('uploads').upload(fileName, file)
        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)

        // Save to DB
        const payload = { 
            content: "Sent an attachment", 
            media_url: data.publicUrl, 
            sender_id: session.user.id, 
            receiver_id: activeThread.type === 'direct' ? activeThread.id : null, 
            group_id: activeThread.type === 'group' ? activeThread.id : null 
        }
        await supabase.from('messages').insert(payload)
    }

    const filteredDirect = directThreads.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    const filteredGroups = groupThreads.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="flex h-[85vh] bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm relative">
            
            {/* FULL SCREEN MEDIA VIEWER */}
            {selectedMedia && (
                <div className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedMedia(null)}>
                    <img src={selectedMedia} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                    <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full text-white hover:bg-white/40"><X/></button>
                </div>
            )}

            <div className="w-80 border-r border-zinc-100 flex flex-col bg-zinc-50/50">
                <div className="p-4 space-y-4">
                    <h2 className="text-xl font-bold px-2 text-zinc-900">{t('messages_header')}</h2>
                    <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" /><Input placeholder={t('search_chats')} className="pl-9 bg-white border-none shadow-sm rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)}/></div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full bg-zinc-200/50 p-1 rounded-xl grid grid-cols-3">
                            <TabsTrigger value="direct" className="rounded-lg text-[10px] font-bold">{t('direct')}</TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-lg text-[10px] font-bold">{t('groups')}</TabsTrigger>
                            <TabsTrigger value="global" className="rounded-lg text-[10px] font-bold">{t('global')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 px-2">
                    {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-300"/></div>}
                    {activeTab === 'direct' && (filteredDirect.length > 0 ? filteredDirect.map(t => (<ThreadItem key={t.id} item={t} active={activeThread?.id === t.id} onClick={() => setActiveThread(t)} icon={MessageCircle} />)) : !loading && <div className="text-center text-xs text-zinc-400 mt-10">{t('noChatsFound')}</div>)}
                    {activeTab === 'groups' && (filteredGroups.length > 0 ? filteredGroups.map(t => (<ThreadItem key={t.id} item={t} active={activeThread?.id === t.id} onClick={() => setActiveThread(t)} icon={Users} />)) : !loading && <div className="text-center text-xs text-zinc-400 mt-10">{t('noGroupsJoined')}</div>)}
                    {activeTab === 'global' && (<ThreadItem item={{ name: t('globalChat'), type: 'global', lastMsg: t('chatWithEveryone') }} active={activeThread?.type === 'global'} onClick={() => setActiveThread({ id: 'global', name:t('globalChat'), type: 'global', image: null })} icon={Globe}/>)}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                {activeThread ? (
                    <>
                        <div className="h-16 border-b border-zinc-50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3"><Avatar className="h-10 w-10 border border-zinc-100"><AvatarImage src={activeThread.image} /><AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">{activeThread.name[0]}</AvatarFallback></Avatar><div><h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">{activeThread.name}</h3>{activeThread.type === 'direct' && <span className="text-[10px] text-zinc-400 flex items-center gap-1">{activeThread.isFriend ? 'Connected' : 'Active Chat'}</span>}</div></div>
                            {activeThread.type === 'direct' && (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => onCall(activeThread, false)} className="text-zinc-400 hover:text-zinc-900"><Phone className="w-5 h-5"/></Button><Button variant="ghost" size="icon" onClick={() => onCall(activeThread, true)} className="text-zinc-400 hover:text-zinc-900"><Video className="w-5 h-5"/></Button><Button variant="ghost" size="icon" className="text-zinc-400"><MoreVertical className="w-5 h-5"/></Button></div>)}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30" ref={scrollRef}>
                            {messages.map((msg: any) => {
                                const isMe = msg.sender_id === session.user.id
                                return (
                                    <div key={msg.id} className={`flex gap-3 animate-in slide-in-from-bottom-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {!isMe && (<Avatar className="h-8 w-8 mt-1 border border-white shadow-sm"><AvatarImage src={msg.profiles?.avatar_url} /><AvatarFallback className="text-[10px] bg-zinc-200">{msg.profiles?.username?.[0]}</AvatarFallback></Avatar>)}
                                        <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end flex flex-col' : ''}`}>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white text-zinc-600 border border-zinc-100 rounded-tl-none'}`}>
                                                <FormattedMessage text={msg.content} isMe={isMe} onNavigate={onNavigate} />
                                                
                                                {/* --- RENDER MEDIA HERE --- */}
                                                {msg.media_url && (
                                                    <div className="mt-2 relative group cursor-pointer" onClick={() => setSelectedMedia(msg.media_url)}>
                                                        <img src={msg.media_url} className="rounded-lg max-h-60 w-full object-cover border border-white/10" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-zinc-50 flex items-center gap-3 bg-white">
                            {/* --- FILE INPUT --- */}
                            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
                            <Button size="icon" variant="ghost" className="text-zinc-400 hover:bg-zinc-50 rounded-full" onClick={() => fileInputRef.current?.click()}><ImageIcon className="w-5 h-5"/></Button>
                            
                            <Input placeholder={t('typeMessage')} className="bg-zinc-50 border-none rounded-full h-11 focus-visible:ring-1 focus-visible:ring-yellow-400" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                            <Button onClick={sendMessage} size="icon" className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-black h-11 w-11 shadow-sm transition-transform active:scale-95"><Send className="w-4 h-4"/></Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 bg-zinc-50/30">
                        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6"><MessageCircle className="w-10 h-10 text-zinc-300" /></div>
                        <p className="text-lg font-bold text-zinc-800">{t('yourMessages')}</p><p className="text-sm text-zinc-400 mt-2">{t('selectChatToStart')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}