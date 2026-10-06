import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next' // <--- IMPORT THIS
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Lock, Globe, Users, Image as ImageIcon, X, Phone, Video, MoreVertical } from 'lucide-react'

// (Keep FormattedMessage component same as provided before)
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
                                }
                            }}
                            className={`underline font-bold hover:opacity-70 cursor-pointer ${isMe ? 'text-white' : 'text-blue-600'}`}>
                            {part}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

type ChatSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  receiver?: any;
  group?: any;
  onCall?: (target: any, isVideo: boolean) => void;
  onNavigate: (type: string, id: string) => void;
}

export default function ChatSheet({ isOpen, onClose, session, receiver, group, onCall, onNavigate }: ChatSheetProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const { t } = useTranslation() // <--- HOOK
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ensure ref is assigned

  useEffect(() => {
    if (!isOpen) return
    setMessages([]); setLoading(true)
    const fetchMessages = async () => {
      let query = supabase.from('messages').select('*, profiles:sender_id(username, avatar_url)').order('created_at', { ascending: true })
      if (group?.id) query = query.eq('group_id', group.id)
      else if (receiver?.id) query = query.or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${session.user.id})`)
      else query = query.is('receiver_id', null).is('group_id', null).is('stream_id', null)
      const { data } = await query
      if (data) setMessages(data)
      setLoading(false)
    }
    fetchMessages()
    const channelName = group?.id ? `group_${group.id}` : receiver?.id ? `private_${receiver.id}` : 'public_chat'
    const channel = supabase.channel(channelName).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const newMsg = payload.new
          let isRelevant = false
          if (group?.id) isRelevant = newMsg.group_id === group.id
          else if (receiver?.id) isRelevant = (newMsg.sender_id === session.user.id && newMsg.receiver_id === receiver.id) || (newMsg.sender_id === receiver.id && newMsg.receiver_id === session.user.id)
          else isRelevant = !newMsg.receiver_id && !newMsg.group_id && !newMsg.stream_id
          if (isRelevant) {
             const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMsg.sender_id).single()
             setMessages((prev) => [...prev, { ...newMsg, profiles: data }])
          }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isOpen, receiver?.id, group?.id])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    await supabase.from('messages').insert({ content: newMessage, sender_id: session.user.id, receiver_id: receiver?.id || null, group_id: group?.id || null, stream_id: null })
    setNewMessage('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return
      
      // Optimistic UI
      const tempUrl = URL.createObjectURL(file)
      setMessages(prev => [...prev, { 
          id: Date.now(), 
          content: "Sent an attachment", 
          media_url: tempUrl, 
          sender_id: session.user.id, 
          profiles: { username: 'Me', avatar_url: session.user.user_metadata.avatar_url } 
      }])

      // Upload
      const fileName = `chat/${Date.now()}_${file.name.replace(/\s/g, '')}`
      await supabase.storage.from('uploads').upload(fileName, file)
      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
      
      // Send DB
      await supabase.from('messages').insert({ 
          content: "Sent an attachment", 
          media_url: data.publicUrl, 
          sender_id: session.user.id, 
          receiver_id: receiver?.id || null, 
          group_id: group?.id || null, 
          stream_id: null 
      })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[100vw] sm:w-[540px] flex flex-col p-0 bg-white border-l border-zinc-200">
        <SheetHeader className="p-4 border-b border-zinc-100 bg-white flex flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
                {group ? (
                   <>
                    <Avatar className="h-9 w-9"><AvatarImage src={group.image_url} /><AvatarFallback>G</AvatarFallback></Avatar>
                    <div className="flex flex-col items-start"><span className="text-zinc-900 font-bold">{group.name}</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Users className="w-3 h-3 text-yellow-500"/> {t('groupChat')}</span></div>
                   </>
                ) : receiver ? (
                  <>
                    <Avatar className="h-9 w-9"><AvatarImage src={receiver.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex flex-col items-start"><span className="text-zinc-900 font-bold">{receiver.username}</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Lock className="w-3 h-3 text-yellow-500"/>{t('privateChat')}</span></div>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <div className="flex flex-col items-start"><span className="text-zinc-900 font-bold">{t('globalLiveChat')}</span><span className="text-[10px] text-zinc-400 font-normal flex items-center gap-1"><Globe className="w-3 h-3 text-yellow-500"/>{t('publicRoom')}</span></div>
                  </>
                )}
            </SheetTitle>

            {receiver && onCall && (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-yellow-600" onClick={() => onCall(receiver, false)}><Phone className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-yellow-600" onClick={() => onCall(receiver, true)}><Video className="w-5 h-5"/></Button>
                    <Button variant="ghost" size="icon" className="text-zinc-400"><MoreVertical className="w-5 h-5"/></Button>
                </div>
            )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50" ref={scrollRef}>
             {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-400" /></div>}
             {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                        <Avatar className="h-8 w-8 ring-2 ring-white"><AvatarImage src={msg.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none'}`}>
                            {!isMe && <p className="text-[10px] text-zinc-400 font-bold mb-1">{msg.profiles?.username}</p>}
                            
                            <FormattedMessage text={msg.content} isMe={isMe} onNavigate={(t, i) => { onClose(); onNavigate(t, i); }} />
                            
                            {/* --- MEDIA RENDERING FIX --- */}
                            {msg.media_url && (
                                <img 
                                    src={msg.media_url} 
                                    className="mt-2 rounded-lg max-h-40 w-full object-cover cursor-pointer border border-white/10" 
                                    onClick={() => setSelectedMedia(msg.media_url)} 
                                />
                            )}
                        </div>
                    </div>
                )
             })}
        </div>

        <div className="p-4 bg-white border-t border-zinc-100 flex gap-2 items-center">
            {/* --- FILE INPUT LOGIC --- */}
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
            <Button size="icon" variant="ghost" className="hover:bg-yellow-50" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-5 w-5 text-zinc-400 hover:text-yellow-600"/>
            </Button>
            
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('typeMessage')} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="bg-zinc-50 border-zinc-100 rounded-full h-11 focus-visible:ring-yellow-400"/>
            <Button size="icon" className="rounded-full bg-yellow-400 hover:bg-yellow-500 h-11 w-11 shrink-0 text-black shadow-sm" onClick={handleSend}><Send className="h-4 w-4" /></Button>
        </div>

        {selectedMedia && (
            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedMedia(null)}>
                <img src={selectedMedia} className="max-h-full max-w-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()}/>
                <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/40"><X/></button>
            </div>
        )}
      </SheetContent>
    </Sheet>
  )
}