import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { X, Send, Heart, Radio } from 'lucide-react'

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
}

export default function LiveViewer({ session, stream, onClose }: { session: any, stream: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [likes, setLikes] = useState(0)
  
  // WebRTC Refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    // 1. Setup Chat & Signal Listener
    const channel = supabase.channel(`live_chat_${stream.id}`)
      .on('broadcast', { event: 'message' }, (payload) => setMessages(prev => [...prev, payload.payload]))
      .on('broadcast', { event: 'like' }, () => setLikes(prev => prev + 1))
      .subscribe()
    
    // 2. Setup WebRTC Signaling for Video
    setupWebRTC()

    return () => { 
        supabase.removeChannel(channel)
        if (peerConnection.current) peerConnection.current.close()
    }
  }, [stream.id])

  const setupWebRTC = async () => {
      const pc = new RTCPeerConnection(servers)
      peerConnection.current = pc

      // When we receive a video track from the host
      pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0]
          }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
          if (event.candidate) {
              supabase.channel(`room_${stream.id}`).send({
                  type: 'broadcast',
                  event: 'ice-candidate',
                  payload: { candidate: event.candidate, viewerId: session.user.id }
              })
          }
      }

      // Listen for signals from Host
      const signalChannel = supabase.channel(`room_${stream.id}`)
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
            if (payload.viewerId !== session.user.id) return
            
            // Host sent an offer, we accept it
            await pc.setRemoteDescription(payload.sdp)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            // Send Answer back
            signalChannel.send({
                type: 'broadcast',
                event: 'answer',
                payload: { sdp: answer, viewerId: session.user.id }
            })
        })
        .on('broadcast', { event: 'ice-candidate-host' }, ({ payload }) => {
            if (payload.viewerId === session.user.id) {
                pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // Tell Host we are here!
                signalChannel.send({
                    type: 'broadcast',
                    event: 'join_request',
                    payload: { viewerId: session.user.id }
                })
            }
        })
  }

  // ... (Keeping your existing Chat Logic below)
  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const msg = {
        id: Date.now(),
        user_id: session.user.id,
        username: session.user.user_metadata.username || 'User',
        avatar_url: session.user.user_metadata.avatar_url,
        content: newMessage,
        isSystem: false
    }
    await supabase.channel(`live_chat_${stream.id}`).send({ type: 'broadcast', event: 'message', payload: msg })
    setMessages(prev => [...prev, msg])
    setNewMessage('')
  }

  const sendLike = async () => {
      setLikes(prev => prev + 1)
      await supabase.channel(`live_chat_${stream.id}`).send({ type: 'broadcast', event: 'like' })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row">
        {/* VIDEO AREA */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* The Actual Video Feed */}
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />

            <Button variant="ghost" className="absolute top-4 left-4 text-white hover:bg-white/10 z-50 rounded-full" onClick={onClose}>
                <X className="w-6 h-6 mr-2" /> Leave Room
            </Button>
            
            <div className="absolute top-6 right-6 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                <Radio className="w-3 h-3" /> LIVE
            </div>
        </div>

        {/* CHAT AREA */}
        <div className="w-full md:w-[400px] bg-white flex flex-col border-l border-zinc-800 h-[40vh] md:h-full">
            <div className="p-4 border-b flex items-center gap-2 bg-white shadow-sm z-10">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="font-bold text-zinc-900">Live Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
                {messages.map((m) => (
                    <div key={m.id} className={`flex gap-2 ${m.isSystem ? 'justify-center' : ''}`}>
                        {!m.isSystem && (
                            <>
                                <Avatar className="w-8 h-8"><AvatarImage src={m.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="flex flex-col max-w-[85%]">
                                    <span className="text-[10px] font-bold text-zinc-500 ml-1">{m.username}</span>
                                    <div className="bg-white border border-zinc-200 px-3 py-2 rounded-2xl text-sm">{m.content}</div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-white flex items-center gap-2">
                <Button size="icon" variant="ghost" className="text-red-500" onClick={sendLike}><Heart className="w-6 h-6" /></Button>
                <Input className="rounded-full bg-zinc-100 border-none" placeholder="Say something..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <Button size="icon" className="rounded-full bg-indigo-600" onClick={sendMessage}><Send className="w-4 h-4" /></Button>
            </div>
        </div>
    </div>
  )
}