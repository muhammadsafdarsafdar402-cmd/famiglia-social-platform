import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Loader2, Wifi, Signal, SignalHigh, SignalLow } from 'lucide-react'

// --- CONFIG ---
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy
}

export default function CallOverlay({ session, activeCall, onEndCall }: { session: any, activeCall: any, onEndCall: () => void }) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [connectionStatus, setConnectionStatus] = useState('Initializing...')
    const [isMicOn, setIsMicOn] = useState(true)
    const [isCamOn, setIsCamOn] = useState(activeCall.isVideo)
    const [isLowDataMode, setIsLowDataMode] = useState(false)
    
    const pc = useRef<RTCPeerConnection | null>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const signalingChannel = useRef<any>(null)
    const offerInterval = useRef<NodeJS.Timeout | null>(null)
    const candidatesQueue = useRef<RTCIceCandidateInit[]>([]) 

    useEffect(() => {
        startCallSequence()
        return () => cleanupCall()
    }, [])

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
            localVideoRef.current.muted = true // Prevents local echo loop
        }
    }, [localStream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
            remoteVideoRef.current.play().catch(e => console.error("Auto-play blocked:", e))
        }
    }, [remoteStream])

    const cleanupCall = () => {
        if (offerInterval.current) clearInterval(offerInterval.current)
        localStream?.getTracks().forEach(t => t.stop())
        if (pc.current) {
            pc.current.onicecandidate = null
            pc.current.ontrack = null
            pc.current.close()
        }
        if (signalingChannel.current) supabase.removeChannel(signalingChannel.current)
    }

    const handleHangup = async () => {
        if (signalingChannel.current) {
            await signalingChannel.current.send({ type: 'broadcast', event: 'hangup', payload: { sender: session.user.id } })
        }
        onEndCall()
    }

    // --- AUDIO TUNING ---
    const optimizeSdp = (sdp: string) => {
        let newSdp = sdp
        // 1. CLEAN AUDIO FIX:
        // useinbandfec=1 -> Repairs lost packets (No robotic voice)
        // usedtx=0 -> Never stop sending audio (Fixes "chunks" cutting out)
        // stereo=0 -> Mono audio (Saves bandwidth)
        // maxaveragebitrate=48000 -> Sweet spot for voice clarity
        newSdp = newSdp.replace(/a=fmtp:111 ((?:(?!minptime).)*)/g, 'a=fmtp:111 $1;useinbandfec=1;usedtx=0;stereo=0;maxaveragebitrate=48000')
        return newSdp
    }

    const toggleLowDataMode = () => {
        const newState = !isLowDataMode
        setIsLowDataMode(newState)
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            if (videoTrack) videoTrack.enabled = !newState && isCamOn
        }
    }

    const startCallSequence = async () => {
        signalingChannel.current = supabase.channel(`call_room_${activeCall.id}`)
        
        signalingChannel.current
            .on('broadcast', { event: 'hangup' }, () => onEndCall())
            .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
                if (payload.sender === session.user.id) return
                if (pc.current?.signalingState !== 'stable') return 

                try {
                    await pc.current?.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    while (candidatesQueue.current.length > 0) await pc.current?.addIceCandidate(new RTCIceCandidate(candidatesQueue.current.shift()!))
                    
                    const answer = await pc.current?.createAnswer()
                    if (answer.sdp) answer.sdp = optimizeSdp(answer.sdp)
                    await pc.current?.setLocalDescription(answer)
                    
                    signalingChannel.current.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, sender: session.user.id } })
                } catch (e) { console.error(e) }
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
                if (payload.sender === session.user.id) return
                if (pc.current?.signalingState !== 'have-local-offer') return 

                try {
                    if (offerInterval.current) clearInterval(offerInterval.current)
                    await pc.current?.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    while (candidatesQueue.current.length > 0) await pc.current?.addIceCandidate(new RTCIceCandidate(candidatesQueue.current.shift()!))
                } catch (e) { console.error(e) }
            })
            .on('broadcast', { event: 'candidate' }, async ({ payload }: any) => {
                if (payload.sender === session.user.id) return
                if (pc.current?.remoteDescription) { try { await pc.current?.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch(e){} }
                else candidatesQueue.current.push(payload.candidate)
            })
            .subscribe()

        setConnectionStatus("Accessing Media...")
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true, // FIXED: Turned ON to stop feedback/noise
                    noiseSuppression: true, // FIXED: Turned ON to clear background hiss
                    autoGainControl: true,  // Levels out volume
                    channelCount: 1
                },
                video: activeCall.isVideo ? { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 24 } } : false
            })
            setLocalStream(stream)

            pc.current = new RTCPeerConnection(RTC_CONFIG)
            stream.getTracks().forEach(track => pc.current?.addTrack(track, stream))

            pc.current.ontrack = (event) => setRemoteStream(event.streams[0])
            pc.current.onconnectionstatechange = () => {
                const state = pc.current?.connectionState
                if (state === 'connected') { setConnectionStatus("Connected"); if (offerInterval.current) clearInterval(offerInterval.current) }
                else if (state === 'failed') setConnectionStatus("Reconnecting...")
            }
            pc.current.onicecandidate = (event) => {
                if (event.candidate) signalingChannel.current?.send({ type: 'broadcast', event: 'candidate', payload: { candidate: event.candidate, sender: session.user.id } })
            }

            setTimeout(async () => {
                if (activeCall.isCaller) {
                    const offer = await pc.current?.createOffer()
                    if (offer && offer.sdp) {
                        offer.sdp = optimizeSdp(offer.sdp)
                        await pc.current?.setLocalDescription(offer)
                        
                        const sendOffer = () => signalingChannel.current.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, sender: session.user.id } })
                        sendOffer()
                        offerInterval.current = setInterval(() => { if (pc.current?.signalingState === 'stable') clearInterval(offerInterval.current!); else sendOffer() }, 3000)
                    }
                }
            }, 1000)

        } catch (err) { console.error(err); setConnectionStatus("Error: Media Access Denied") }
    }

    const toggleMic = () => {
        localStream?.getAudioTracks().forEach(t => { t.enabled = !isMicOn; setIsMicOn(!isMicOn) })
    }

    const toggleCam = () => {
        if (isLowDataMode && !isCamOn) setIsLowDataMode(false)
        localStream?.getVideoTracks().forEach(t => { t.enabled = !isCamOn; setIsCamOn(!isCamOn) })
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-black w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col border border-zinc-800">
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-8 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <Avatar className="h-14 w-14 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20">
                            <AvatarImage src={activeCall.target.avatar_url} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400">U</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-white font-bold text-xl drop-shadow-md">{activeCall.target.username}</h2>
                            <p className={`text-sm font-medium flex items-center gap-2 ${connectionStatus === 'Connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                                {connectionStatus === 'Connected' ? <Wifi className="w-4 h-4"/> : <Loader2 className="w-4 h-4 animate-spin"/>}
                                {connectionStatus}
                            </p>
                        </div>
                    </div>
                    <div className="pointer-events-auto">
                        <Button variant="secondary" size="sm" onClick={toggleLowDataMode} className={`rounded-full gap-2 transition-colors ${isLowDataMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white/10 text-zinc-400 hover:bg-white/20'}`}>
                            {isLowDataMode ? <SignalLow className="w-4 h-4"/> : <SignalHigh className="w-4 h-4"/>}
                            {isLowDataMode ? "Audio Only" : "HD Mode"}
                        </Button>
                    </div>
                </div>

                {/* Main Video */}
                <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${connectionStatus === 'Connected' ? 'opacity-100' : 'opacity-0'}`} />
                    
                    {(connectionStatus !== 'Connected' || !remoteStream) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <Avatar className="h-32 w-32 ring-4 ring-zinc-800 grayscale opacity-50"><AvatarImage src={activeCall.target.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full text-black animate-spin"><Loader2 className="w-6 h-6" /></div>
                            </div>
                            <p className="text-zinc-500 font-medium tracking-wide animate-pulse uppercase text-sm">{connectionStatus === 'Connected' ? 'Waiting for video...' : 'Establishing Secure Line...'}</p>
                        </div>
                    )}

                    {/* Local PIP */}
                    {activeCall.isVideo && (
                        <div className="absolute bottom-32 right-8 w-32 md:w-48 aspect-[9/16] md:aspect-video bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/50 z-30 group">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                            {(!isCamOn || isLowDataMode) && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm">{isLowDataMode ? <SignalLow className="w-8 h-8 text-yellow-500"/> : <VideoOff className="w-8 h-8 text-zinc-600"/>}</div>}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="h-28 bg-zinc-950 flex items-center justify-center gap-6 md:gap-10 z-20 pb-6 px-10 border-t border-zinc-900">
                    <Button size="icon" className={`h-16 w-16 rounded-full shadow-lg transition-all ${isMicOn ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-black hover:bg-zinc-200'}`} onClick={toggleMic}>{isMicOn ? <Mic className="w-6 h-6"/> : <MicOff className="w-6 h-6"/>}</Button>
                    <Button size="icon" className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 hover:scale-105 transition-transform" onClick={handleHangup}><PhoneOff className="h-8 w-8 fill-current" /></Button>
                    <Button size="icon" className={`h-16 w-16 rounded-full shadow-lg transition-all ${isCamOn && !isLowDataMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-black hover:bg-zinc-200'}`} onClick={toggleCam} disabled={!activeCall.isVideo}>{isCamOn && !isLowDataMode ? <Video className="w-6 h-6"/> : <VideoOff className="w-6 h-6"/>}</Button>
                </div>
            </div>
        </div>
    )
}