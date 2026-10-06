"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, UserPlus, Loader2, Check, X, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// --- SHARED LIST ITEM ---
const UserListItem = ({ 
    user, 
    subtext, 
    action, 
}: { 
    user: any, 
    subtext: string, 
    action: React.ReactNode,
}) => (
    <div className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-colors group w-full">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 border border-zinc-100 bg-white">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">
                        {user.username?.[0]?.toUpperCase() || <User className="w-4 h-4"/>}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-900 leading-none mb-1 truncate block">
                    {user.username || 'Unknown User'}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium truncate block">
                    {subtext}
                </span>
            </div>
        </div>
        <div className="flex-shrink-0 ml-2">
            {action}
        </div>
    </div>
)

// --- 1. SIDEBAR CHAT WIDGET ---
export function SidebarChatWidget({ session, onChat }: { session: any, onChat: (target: any) => void }) {
    const { t } = useTranslation();
    const [productChats, setProductChats] = useState<any[]>([])
    const [friends, setFriends] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const refreshData = async () => {
        const myId = session.user.id

        // 1. GET FRIENDS
        const { data: friendsRel } = await supabase.from('friends')
            .select('user_a, user_b')
            .or(`user_a.eq.${myId},user_b.eq.${myId}`)
        
        const friendIds = new Set<string>()
        friendsRel?.forEach(f => friendIds.add(f.user_a === myId ? f.user_b : f.user_a))

        if (friendIds.size > 0) {
            const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', Array.from(friendIds))
            if (friendProfiles) setFriends(friendProfiles)
        } else {
            setFriends([])
        }

        // 2. GET PRODUCT MESSAGES
        const { data: msgs } = await supabase.from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
            .order('created_at', { ascending: false })
            .limit(50)
        
        if (msgs) {
            const chatIds = new Set<string>()
            msgs.forEach(m => {
                const partner = m.sender_id === myId ? m.receiver_id : m.sender_id
                if (partner && !friendIds.has(partner)) chatIds.add(partner)
            })
            
            if (chatIds.size > 0) {
                const { data: chatProfiles } = await supabase.from('profiles').select('*').in('id', Array.from(chatIds))
                if (chatProfiles) setProductChats(chatProfiles)
            } else {
                setProductChats([])
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        refreshData()
        const channel = supabase.channel('sidebar_friends_update')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => refreshData())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refreshData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [session.user.id])

    return (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-zinc-100">
            <Tabs defaultValue="friends" className="w-full">
                <TabsList className="w-full bg-zinc-100/50 p-1 rounded-xl mb-4 h-10">
                    <TabsTrigger value="messages" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('widget_chat_product')}</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('widget_chat_friends')}</TabsTrigger>
                </TabsList>
                <TabsContent value="messages" className="space-y-1 min-h-[200px]">
                    {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-300"/></div> : productChats.length === 0 ? <p className="text-center text-xs text-zinc-400 py-8">No chats.</p> : productChats.map(user => (<UserListItem key={user.id} user={user} subtext="User" action={<Button size="icon" variant="ghost" onClick={() => onChat(user)} className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-yellow-400 hover:text-black"><MessageCircle className="w-4 h-4" /></Button>}/>))}
                </TabsContent>
                <TabsContent value="friends" className="space-y-1 min-h-[200px]">
                    {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-300"/></div> : friends.length === 0 ? <p className="text-center text-xs text-zinc-400 py-8">No friends.</p> : friends.map(user => (<UserListItem key={user.id} user={user} subtext="Friend" action={<Button size="icon" variant="ghost" onClick={() => onChat(user)} className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-yellow-400 hover:text-black"><MessageCircle className="w-4 h-4" /></Button>}/>))}
                </TabsContent>
            </Tabs>
        </div>
    )
}

// --- 2. INCOMING REQUESTS ---
export function IncomingRequests({ session }: { session: any }) {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        // Fetch requests where I am the RECEIVER
        const { data } = await supabase.from('friend_requests')
            .select('id, sender:sender_id(*)') 
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending')
        if (data) setRequests(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
        const channel = supabase.channel('requests_widget')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${session.user.id}` }, () => fetchRequests())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleAccept = async (reqId: number, senderId: string) => {
        // 1. Insert into Friends
        const { error } = await supabase.from('friends').insert({ user_a: session.user.id, user_b: senderId })
        
        if (!error) {
            // 2. Remove Request only if friend add was successful
            await supabase.from('friend_requests').delete().eq('id', reqId)
            setRequests(prev => prev.filter(r => r.id !== reqId))
        }
    }

    const handleReject = async (reqId: number) => {
        await supabase.from('friend_requests').delete().eq('id', reqId)
        setRequests(prev => prev.filter(r => r.id !== reqId))
    }

   return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-zinc-900">{t('widget_requests')}</h3>
                {requests.length > 0 && <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{requests.length} {t('widget_new')}</span>}
            </div>
            <div className="space-y-3">
                {loading ? <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-300"/></div> : 
                 requests.length === 0 ? <p className="text-xs text-zinc-400 italic text-center py-4">{t('widget_no_requests')}</p> :
                 requests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-10 w-10 border border-zinc-100 flex-shrink-0"><AvatarImage src={req.sender?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                            <div className="flex flex-col min-w-0"><p className="text-sm font-bold text-zinc-900 truncate block max-w-[120px]">{req.sender?.username || 'User'}</p></div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <Button size="icon" onClick={() => handleAccept(req.id, req.sender.id)} className="h-8 w-8 rounded-full bg-zinc-900 text-white hover:bg-green-600 transition-colors shadow-sm"><Check className="w-4 h-4"/></Button>
                            <Button size="icon" variant="outline" onClick={() => handleReject(req.id)} className="h-8 w-8 rounded-full border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50"><X className="w-4 h-4"/></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- 3. SUGGESTED FRIENDS (FIXED) ---
export function SuggestedFriends({ session , onViewProfile}: { session: any ,onViewProfile: (id: string) => void }) {
    const [users, setUsers] = useState<any[]>([])
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchUsers = async () => {
            // 1. Get existing friends
            const { data: relationships } = await supabase.from('friends')
                .select('user_a, user_b')
                .or(`user_a.eq.${session.user.id},user_b.eq.${session.user.id}`)
            
            const excludedIds = new Set([session.user.id])
            relationships?.forEach(r => {
                excludedIds.add(r.user_a)
                excludedIds.add(r.user_b)
            })

            // 2. Get pending sent requests (to exclude them too)
            const { data: pending } = await supabase.from('friend_requests')
                .select('receiver_id')
                .eq('sender_id', session.user.id)
            
            pending?.forEach(p => excludedIds.add(p.receiver_id))

            // 3. Fetch profiles not in that list
            const { data } = await supabase.from('profiles')
                .select('*')
                .limit(15) // Fetch a few more to account for filtering
            
            if (data) {
                const filtered = data.filter(u => !excludedIds.has(u.id)).slice(0, 5)
                setUsers(filtered)
            }
        }
        fetchUsers()
    }, [session.user.id])

    const handleAddFriend = async (targetId: string) => {
        // Optimistic UI update
        setSentRequests(prev => new Set(prev).add(targetId))

        // FIX: Insert into 'friend_requests', NOT 'friends'
        const { error } = await supabase.from('friend_requests').insert({
            sender_id: session.user.id,
            receiver_id: targetId,
            status: 'pending'
        })

        if (error) {
            console.error("Error adding friend:", error)
            alert("Failed to send request")
            // Revert UI if failed
            setSentRequests(prev => {
                const next = new Set(prev)
                next.delete(targetId)
                return next
            })
        }
    }

    if (users.length === 0) return null

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
            <h3 className="font-bold text-zinc-900 mb-4">Suggested for you</h3>
            <div className="space-y-4">
                {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar onClick={() => onViewProfile(u.id)} className="h-10 cursor-pointer w-10 border border-zinc-100">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback>{u.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-900">{u.username}</span>
                                <span className="text-[10px] text-zinc-400">{u.profession || 'Member'}</span>
                            </div>
                        </div>
                        {sentRequests.has(u.id) ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 bg-green-50" disabled>
                                <Check className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAddFriend(u.id)}
                                className="h-8 w-8 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-full"
                            >
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}