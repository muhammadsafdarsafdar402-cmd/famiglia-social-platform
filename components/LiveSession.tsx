import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, Radio, Users } from 'lucide-react'

// Free Google STUN servers to punch through firewalls
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
}

export default function LiveSession({ session }: { session: any }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLive, setIsLive] = useState(false)
  const [viewers, setViewers] = useState(0)
  
  // We keep track of connections to viewers here
  const peerConnections = useRef<{[key: string]: RTCPeerConnection}>({})
  const localStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
       stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStream.current = stream
        if (videoRef.current) {
            videoRef.current.srcObject = stream
        }

        // 1. Register Session in DB
        const { data } = await supabase.from('live_sessions').insert({ user_id: session.user.id, status: 'live' }).select().single()
        const sessionId = data.id

        // 2. Listen for Viewers joining ("signals")
        supabase.channel(`room_${sessionId}`)
            .on('broadcast', { event: 'join_request' }, async ({ payload }) => {
                // A viewer wants to join! Create a connection for them.
                createPeerConnection(payload.viewerId, sessionId, stream)
                setViewers(prev => prev + 1)
            })
            .on('broadcast', { event: 'answer' }, ({ payload }) => {
                // Viewer accepted our call
                const pc = peerConnections.current[payload.viewerId]
                if (pc) pc.setRemoteDescription(payload.sdp)
            })
            .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
                // Network path finding
                const pc = peerConnections.current[payload.viewerId]
                if (pc) pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            })
            .subscribe()

        setIsLive(true)
    } catch (err) {
        console.error(err)
        alert("Camera access denied")
    }
  }

  const createPeerConnection = async (viewerId: string, sessionId: any, stream: MediaStream) => {
      const pc = new RTCPeerConnection(servers)
      peerConnections.current[viewerId] = pc

      // Add local video tracks to the connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Handle ICE candidates (network paths)
      pc.onicecandidate = (event) => {
          if (event.candidate) {
              supabase.channel(`room_${sessionId}`).send({
                  type: 'broadcast',
                  event: 'ice-candidate-host',
                  payload: { candidate: event.candidate, viewerId }
              })
          }
      }

      // Create Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send Offer to Viewer
      await supabase.channel(`room_${sessionId}`).send({
          type: 'broadcast',
          event: 'offer',
          payload: { sdp: offer, viewerId }
      })
  }

  const stopCamera = async () => {
      localStream.current?.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close())
      peerConnections.current = {}

      await supabase.from('live_sessions').delete().eq('user_id', session.user.id)
      setIsLive(false)
      setViewers(0)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden relative shadow-xl ring-4 ring-zinc-100">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                {!isLive ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-zinc-900/50">
                        <Camera className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-medium">Ready to start streaming?</p>
                    </div>
                ) : (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                        <Radio className="w-3 h-3" /> LIVE
                    </div>
                )}
            </div>
            <div className="flex justify-center gap-4">
                {!isLive ? (
                    <Button onClick={startCamera} size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-700 w-48">Go Live</Button>
                ) : (
                    <Button onClick={stopCamera} size="lg" className="rounded-full bg-red-600 hover:bg-red-700 w-48">End Stream</Button>
                )}
            </div>
        </div>
        <Card className="p-4 rounded-3xl border-none shadow-sm h-[500px] flex flex-col bg-white">
            <h3 className="font-bold border-b pb-2 mb-2 text-zinc-800">Live Chat</h3>
            <div className="flex-1 bg-zinc-50 rounded-xl p-4 text-sm text-zinc-500 mb-4 flex items-center justify-center">
                {isLive ? "Chat is active on Viewer side" : "Chat paused"}
            </div>
        </Card>
    </div>
  )
}