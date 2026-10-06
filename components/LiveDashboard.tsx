import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, Mic, MicOff, VideoOff, MessageCircle, Send, Users, Heart, Loader2, Volume2, VolumeX, RefreshCw, ShieldCheck, Radio, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import SubscriptionPlans from './SubscriptionPlan'

// --- CONFIG ---
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const TIERS_WITH_LIVE_ACCESS = [
  'verified_live', 'content_creator', 'content_upload_badge',
  'content_no_hub', 'full_suite_access', 'ultimate_no_hub', 'suitehub_access'
]

// --- CHAT COMPONENT ---
function LiveChat({ session, streamId }: { session: any, streamId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => { const { data } = await supabase.from('messages').select('*, profiles(username, avatar_url)').eq('stream_id', streamId).order('created_at', { ascending: true }); if (data) setMessages(data) }
    fetchMessages()
    const channel = supabase.channel(`live_chat_${streamId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `stream_id=eq.${streamId}` }, async (payload) => { if (payload.new.sender_id === session.user.id) return; const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.sender_id).single(); setMessages(prev => [...prev, { ...payload.new, profiles: data }]); if (scrollRef.current) setTimeout(() => { scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight }, 100) }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [streamId])

  const sendMessage = async (e?: React.FormEvent) => { e?.preventDefault(); if (!newMessage.trim()) return; const msgContent = newMessage; setNewMessage(''); const tempMsg = { id: Date.now(), content: msgContent, sender_id: session.user.id, stream_id: streamId, profiles: { username: 'Me', avatar_url: session.user.user_metadata?.avatar_url } }; setMessages(prev => [...prev, tempMsg]); if (scrollRef.current) setTimeout(() => { scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight }, 100); await supabase.from('messages').insert({ content: msgContent, sender_id: session.user.id, stream_id: streamId }) }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-900 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-yellow-500" /> Live Chat</span>
        <span className="text-xs text-zinc-400">{messages.length} msgs</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && <div className="text-center text-zinc-300 text-xs mt-10">Say hello! 👋</div>}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
            <Avatar className="w-6 h-6 mt-1"><AvatarImage src={msg.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="flex-1"><p className="text-xs font-bold text-zinc-500 mb-0.5">{msg.profiles?.username || 'User'}</p><p className="text-sm text-zinc-800 bg-zinc-50 px-3 py-1.5 rounded-r-xl rounded-bl-xl inline-block shadow-sm border border-zinc-100">{msg.content}</p></div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t border-zinc-100 flex gap-2 bg-white"><Input className="rounded-full bg-zinc-50 border-zinc-200 focus:bg-white h-10 text-sm focus-visible:ring-yellow-400" placeholder="Say hello..." value={newMessage} onChange={e => setNewMessage(e.target.value)} /><Button size="icon" type="submit" className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-black w-10 h-10 shrink-0 shadow-sm"><Send className="w-4 h-4" /></Button></form>
    </div>
  )
}

// --- BROADCASTER (HOST) ---
function Broadcaster({ session }: { session: any }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({})
  const localStream = useRef<MediaStream | null>(null)

  useEffect(() => { return () => { if (isStreaming) stopStream() } }, [])

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) videoRef.current.srcObject = stream
      localStream.current = stream
      setIsStreaming(true); setIsMicOn(true); setIsCamOn(true)
      await supabase.from('profiles').update({ is_live: true }).eq('id', session.user.id)
      supabase.channel(`room_${session.user.id}`).on('broadcast', { event: 'viewer_join' }, async ({ payload }) => { createPeerConnection(payload.viewerId, stream) }).on('broadcast', { event: 'answer' }, ({ payload }) => { const pc = peerConnections.current[payload.viewerId]; if (pc) pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)) }).on('broadcast', { event: 'ice-candidate' }, ({ payload }) => { const pc = peerConnections.current[payload.viewerId]; if (pc) pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) }).subscribe()
    } catch (err) { console.error(err); alert("Permissions required.") }
  }

  const createPeerConnection = async (viewerId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current[viewerId] = pc
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.onicecandidate = (event) => { if (event.candidate) supabase.channel(`room_${session.user.id}`).send({ type: 'broadcast', event: 'ice-candidate', payload: { candidate: event.candidate, target: viewerId } }) }
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
    supabase.channel(`room_${session.user.id}`).send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, target: viewerId } })
  }

  const stopStream = async () => {
    setIsStreaming(false); if (localStream.current) localStream.current.getTracks().forEach(t => t.stop())
    Object.values(peerConnections.current).forEach(pc => pc.close()); peerConnections.current = {}
    await supabase.from('profiles').update({ is_live: false }).eq('id', session.user.id); window.location.reload()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="relative bg-black rounded-3xl overflow-hidden aspect-video shadow-lg ring-4 ring-zinc-100 group">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 z-10"><div className="w-2 h-2 bg-white rounded-full" /> {isStreaming ? "LIVE" : "OFFLINE"}</div>
          {isStreaming && (<div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20"> <Button onClick={() => { if (localStream.current) { const t = localStream.current.getAudioTracks()[0]; if (t) { t.enabled = !isMicOn; setIsMicOn(!isMicOn) } } }} variant={isMicOn ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12 shadow-lg">{isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}</Button> <Button onClick={() => { if (localStream.current) { const t = localStream.current.getVideoTracks()[0]; if (t) { t.enabled = !isCamOn; setIsCamOn(!isCamOn) } } }} variant={isCamOn ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12 shadow-lg">{isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}</Button> </div>)}
        </div>
        {!isStreaming ? <Button onClick={startStream} className="w-full py-6 text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl">Go Live Now</Button> : <Button onClick={stopStream} variant="outline" className="w-full py-6 text-lg font-bold rounded-xl border-red-200 text-red-600 hover:bg-red-50">End Stream</Button>}
      </div>
      <div className="lg:col-span-1"><LiveChat session={session} streamId={session.user.id} /></div>
    </div>
  )
}

// --- VIEWER ---
function Viewer({ session, hostId }: { session: any, hostId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState("Connecting...")
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pc.ontrack = (event) => { if (videoRef.current) { videoRef.current.srcObject = event.streams[0]; setStatus("Live") } }
    pc.onicecandidate = (event) => { if (event.candidate) supabase.channel(`room_${hostId}`).send({ type: 'broadcast', event: 'ice-candidate', payload: { candidate: event.candidate, viewerId: session.user.id } }) }
    const channel = supabase.channel(`room_${hostId}`).on('broadcast', { event: 'offer' }, async ({ payload }) => { if (payload.target !== session.user.id) return; await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, viewerId: session.user.id } }) }).on('broadcast', { event: 'ice-candidate' }, ({ payload }) => { if (payload.target === session.user.id) pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) }).subscribe((status) => { if (status === 'SUBSCRIBED') channel.send({ type: 'broadcast', event: 'viewer_join', payload: { viewerId: session.user.id } }) })
    return () => { pc.close(); supabase.removeChannel(channel) }
  }, [hostId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2"><div className="bg-black rounded-3xl overflow-hidden aspect-video flex items-center justify-center relative shadow-xl group">{status !== "Live" && <div className="absolute z-10 text-white flex flex-col items-center"><Loader2 className="animate-spin mb-2" />{status}</div>}<video ref={videoRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-cover" /><button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 right-4 bg-black/50 p-3 rounded-full text-white hover:bg-black/70 transition">{isMuted ? <VolumeX /> : <Volume2 />}</button></div></div>
      <div className="lg:col-span-1"><LiveChat session={session} streamId={hostId} /></div>
    </div>
  )
}

// --- MAIN DASHBOARD ---
export default function LiveDashboard({ session }: { session: any }) {
  const [role, setRole] = useState<'host' | 'viewer' | null>(null)
  const [activeHostId, setActiveHostId] = useState<string>('')
  const [activeStreams, setActiveStreams] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canStream, setCanStream] = useState<boolean | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const fetchStreams = async () => { setIsRefreshing(true); const { data } = await supabase.from('profiles').select('*').eq('is_live', true); if (data) setActiveStreams(data); setIsRefreshing(false) }

  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.from('profiles').select('verified_tier').eq('id', session.user.id).single()
      if (data?.verified_tier && TIERS_WITH_LIVE_ACCESS.includes(data.verified_tier)) {
        setCanStream(true)
      } else {
        setCanStream(false)
      }
    }
    checkAccess()
  }, [session])

  useEffect(() => { fetchStreams(); const channel = supabase.channel('global_presence').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, fetchStreams).subscribe(); return () => { supabase.removeChannel(channel) } }, [])

  if (!role) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {/* --- HOST SECTION (WITH TRAP) --- */}
        {canStream === true ? (
          // ALLOWED: Show normal start button
          <div onClick={() => setRole('host')} className="cursor-pointer bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl p-10 text-black hover:scale-[1.02] transition flex flex-col items-center justify-center text-center space-y-4 shadow-xl shadow-yellow-200/50">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm"><Video className="w-12 h-12 text-zinc-900" /></div>
            <h2 className="text-3xl font-black">Start Streaming</h2>
            <p className="font-medium opacity-80">Go live for your friends now.</p>
          </div>
        ) : (
          // LOCKED: Show Paywall Trap
          <div onClick={() => setShowPaywall(true)} className="cursor-pointer bg-zinc-900 rounded-3xl p-10 text-white hover:scale-[1.02] transition flex flex-col items-center justify-center text-center space-y-4 shadow-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full"></div>
            <div className="bg-zinc-800 p-4 rounded-full backdrop-blur-sm relative z-10"></div>
            <h2 className="text-3xl font-black relative z-10">Start Streaming</h2>
            <p className="font-medium text-zinc-500 relative z-10">Exclusive to Verified Creators</p>
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">LOCKED</span>
          </div>
        )}
        {/* --- VIEWER SECTION (Always Allowed) --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2"><h3 className="font-bold text-zinc-800">Live Now</h3><Button size="sm" variant="ghost" onClick={fetchStreams} className="text-zinc-400 hover:text-yellow-600"><RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh</Button></div>
          {activeStreams.length === 0 && <p className="text-zinc-400 px-2 text-sm italic">No one is live right now.</p>}
          {activeStreams.map(stream => (
            <div key={stream.id} onClick={() => { setActiveHostId(stream.id); setRole('viewer') }} className="cursor-pointer bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md flex items-center gap-4 transition-all">
              <div className="relative"><Avatar><AvatarImage src={stream.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar><span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" /></div>
              <div><p className="font-bold text-sm text-zinc-900">{stream.username}</p><p className="text-xs text-zinc-500">Click to watch</p></div>
              <Button size="sm" variant="secondary" className="ml-auto rounded-full bg-red-50 text-red-600 hover:bg-red-100">Watch Live</Button>
            </div>
          ))}
        </div>
        {/* --- PAYWALL MODAL --- */}
        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none p-0 overflow-hidden">
            <div className="bg-zinc-900 p-8 text-center text-white relative">
              <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="h-6 w-6" /></button>
              <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                <Radio className="h-8 w-8 text-red-500 animate-pulse" />
              </div>
              <DialogTitle className="text-2xl font-black">Creator Studio</DialogTitle>                          <p className="text-zinc-400 mt-2 text-sm">Live streaming is exclusive to Verified Live creators.</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <ShieldCheck className="h-8 w-8 text-yellow-600" />
                <div className="flex-1">
                  <h4 className="font-bold text-zinc-900">Get Verified Live</h4>
                  <p className="text-xs text-zinc-600">Unlock Streaming & Analytics</p>
                </div>
                <div className="font-bold text-lg text-zinc-900">$5.99<span className="text-xs text-zinc-500 font-normal">/mo</span></div>
              </div>
              <Button onClick={() => { setShowPaywall(false); setShowPlansModal(true); }} className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold">View All Plans</Button>
            </div>
          </DialogContent>
        </Dialog>

        <SubscriptionPlans isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} session={session} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => { setRole(null); window.location.reload(); }} className="text-zinc-500 mb-4 hover:bg-zinc-100 rounded-full">&larr; Back to Lobby</Button>
      {role === 'host' ? <Broadcaster session={session} /> : <Viewer session={session} hostId={activeHostId} />}
    </div>
  )
}