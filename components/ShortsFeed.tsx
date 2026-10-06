"use client"

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Trash2, Plus, Loader2, Play, Send, Upload, X, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ReactionDock from './ReactionDock' 
import { useEmojiSystem } from '@/lib/useEmojiSystem'

// --- TYPE DEFINITIONS ---
type ShortItemProps = {
    short: any;
    session: any;
    onDelete: (id: number) => void;
    onShare: (item: any) => void;
}

type ShortsFeedProps = {
    session: any;
    onShare: (item: any) => void;
    deepLink?: string | null;
}

function formatTimeAgo(dateString: string) {
  const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function ShortItem({ short, session, onDelete, onShare }: ShortItemProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    
    // Comment State
    const [isCommentOpen, setIsCommentOpen] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [isPosting, setIsPosting] = useState(false)

    useEffect(() => {
        setIsLiked(short.short_likes?.some((l: any) => l.user_id === session.user.id))
        setLikeCount(short.short_likes?.length || 0)
    }, [short, session])

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
            setIsPlaying(false)
        } else {
            videoRef.current.play()
            setIsPlaying(true)
        }
    }

    const handleLike = async () => {
        const previousState = isLiked
        setIsLiked(!previousState)
        setLikeCount(prev => previousState ? prev - 1 : prev + 1)

        if (previousState) {
            await supabase.from('short_likes').delete().match({ short_id: short.id, user_id: session.user.id })
        } else {
            await supabase.from('short_likes').insert({ short_id: short.id, user_id: session.user.id })
        }
    }

    const handleReaction = async (emoji: string) => {
        await supabase.from('short_reactions').insert({
            short_id: short.id,
            user_id: session.user.id, 
            emoji: emoji
        })
    }

    const fetchComments = async () => {
        // Double check your table name here. Is it 'short_comments' or 'post_comments'?
        const { data, error } = await supabase
            .from('short_comments') 
            .select('*, profiles(username, avatar_url)')
            .eq('short_id', short.id)
            .order('created_at', { ascending: false })
        
        if (error) console.error("Error fetching comments:", error)
        if (data) setComments(data)
    }

    const postComment = async () => {
        if (!newComment.trim() || isPosting) return
        setIsPosting(true)
        
        try {
            const { data, error } = await supabase
                .from('short_comments')
                .insert({ 
                    short_id: short.id, 
                    user_id: session.user.id, 
                    content: newComment 
                })
                .select('*, profiles(username, avatar_url)')
                .single()

            if (error) {
                console.error("Error posting comment:", error.message)
                alert("Failed to post comment: " + error.message)
            } else if (data) {
                setComments(prev => [data, ...prev])
                setNewComment('')
            }
        } catch (err) {
            console.error("Unexpected error:", err)
        } finally {
            setIsPosting(false)
        }
    }

     const tierLevel = 5;
    const isVip = tierLevel >= 5 ;
   
        const { currentPack } = useEmojiSystem(session?.user?.id , isVip)
    
    return (
        <div id={`short-${short.id}`} className="relative w-full h-full snap-start flex items-center justify-center bg-black border-b border-zinc-900 overflow-hidden group">
            {/* VIDEO PLAYER */}
            <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
                <video ref={videoRef} src={short.video_url} className="w-full h-full object-cover" loop playsInline />
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white"><Play className="w-8 h-8 fill-current"/></div>
                    </div>
                )}
            </div>

            {/* OVERLAY INFO & INTERACTIONS */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                <div className="flex items-end justify-between pointer-events-auto mb-4">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-10 w-10 border border-white/30"><AvatarImage src={short.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                            <div><p className="font-bold text-white text-sm shadow-sm flex items-center gap-2">@{short.profiles?.username}</p></div>
                        </div>
                        <p className="text-white text-sm leading-relaxed line-clamp-2 drop-shadow-md">{short.caption}</p>
                    </div>

                    <div className="flex flex-col gap-4 items-center min-w-[50px]">
                        <Button size="icon" variant="ghost" onClick={handleLike} className="text-white hover:bg-white/10 rounded-full h-12 w-12 flex flex-col gap-1"><ThumbsUp className={`w-7 h-7 ${isLiked ? 'fill-blue-500 text-blue-500' : 'text-white'}`}/><span className="text-[10px] font-medium">{likeCount}</span></Button>
                        <Button size="icon" variant="ghost" onClick={() => { setIsCommentOpen(true); fetchComments(); }} className="text-white hover:bg-white/10 rounded-full h-12 w-12 flex flex-col gap-1"><MessageCircle className="w-7 h-7"/><span className="text-[10px] font-medium">Chat</span></Button>
                        <Button size="icon" variant="ghost" onClick={() => onShare({ type: 'short', data: short })} className="text-white hover:bg-white/10 rounded-full h-12 w-12 flex flex-col gap-1"><Share2 className="w-7 h-7"/><span className="text-[10px] font-medium">Share</span></Button>
                        {session.user.id === short.user_id && <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-500/20 rounded-full h-12 w-12 mt-2" onClick={() => onDelete(short.id)}><Trash2 className="w-6 h-6"/></Button>}
                    </div>
                </div>

                {/* <div className="pointer-events-auto">
                    <ReactionDock activePack={currentPack} onReact={handleReaction} variant="floating" />
                </div> */}
            </div>

            {/* COMMENT SHEET */}
            <Sheet open={isCommentOpen} onOpenChange={setIsCommentOpen}>
                <SheetContent side="bottom" className="h-[70vh] w-full sm:max-w-md mx-auto rounded-t-3xl p-0 bg-white border-none shadow-2xl z-[10002]">
                    <SheetHeader className="p-4 border-b border-zinc-100"><SheetTitle>Comments</SheetTitle></SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[50vh]">
                        {comments.length === 0 && <p className="text-center text-zinc-400 text-sm mt-10">No comments yet. Say something!</p>}
                        {comments.map(c => (
                            <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1">
                                <Avatar className="h-8 w-8"><AvatarImage src={c.profiles?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                <div><p className="text-xs font-bold text-zinc-900">{c.profiles?.username} <span className="font-normal text-zinc-400 ml-2">{formatTimeAgo(c.created_at)}</span></p><p className="text-sm text-zinc-700">{c.content}</p></div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-zinc-100 flex gap-2">
                        <Input 
                            placeholder="Add a comment..." 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && postComment()} 
                            className="rounded-full bg-zinc-100 border-none" 
                            disabled={isPosting}
                        />
                        <Button 
                            size="icon" 
                            className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50" 
                            onClick={postComment}
                            disabled={isPosting || !newComment.trim()}
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default function ShortsFeed({ session, onShare, deepLink }: ShortsFeedProps) {
    const [shorts, setShorts] = useState<any[]>([])
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [caption, setCaption] = useState("")
    

    useEffect(() => { fetchShorts() }, [])

    useEffect(() => {
        if (deepLink && shorts.length > 0) {
            const element = document.getElementById(`short-${deepLink}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [deepLink, shorts])

    const fetchShorts = async () => {
        const { data } = await supabase.from('shorts').select('*, profiles(username, avatar_url), short_likes(user_id)').order('created_at', { ascending: false })
        if (data) setShorts(data)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setIsUploadOpen(true)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)
        try {
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `shorts/${session.user.id}_${Date.now()}.${fileExt}`
            await supabase.storage.from('uploads').upload(fileName, selectedFile)
            const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
            
            await supabase.from('shorts').insert({ 
                user_id: session.user.id, 
                video_url: urlData.publicUrl, 
                caption: caption 
            })
            
            setIsUploadOpen(false)
            setCaption("")
            setSelectedFile(null)
            setPreviewUrl(null)
            fetchShorts()
        } catch (err) { console.error(err); alert("Upload failed") } 
        finally { setUploading(false) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this short?")) return
        const { error } = await supabase.from('shorts').delete().eq('id', id)
        if (!error) setShorts(prev => prev.filter(s => s.id !== id))
    }

    return (
        <div className="relative w-full max-w-md mx-auto h-[80vh] bg-black rounded-3xl overflow-y-auto snap-y snap-mandatory scrollbar-hide shadow-2xl border border-zinc-800">
            <div className="absolute top-4 right-4 z-50">
                <label className="cursor-pointer group">
                    <div className="bg-yellow-400 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center">
                        <Plus className="w-6 h-6"/>
                    </div>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect}/>
                </label>
            </div>

            <Dialog open={isUploadOpen} onOpenChange={(open) => {
                if(!open) { setIsUploadOpen(false); setSelectedFile(null); setPreviewUrl(null); setCaption(""); }
            }}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl border-zinc-100 p-0 overflow-hidden z-[10003]">
                    <DialogHeader className="p-6 pb-2 border-b border-zinc-50">
                        <DialogTitle>New Short</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-zinc-200">
                            {previewUrl ? (
                                <video src={previewUrl} className="w-full h-full object-cover" controls />
                            ) : (
                                <div className="text-zinc-500 flex flex-col items-center"><Upload className="w-8 h-8 mb-2"/><span className="text-xs">No video</span></div>
                            )}
                        </div>
                        <Textarea 
                            placeholder="Write a caption..." 
                            className="bg-zinc-50 border-none rounded-xl resize-none h-24" 
                            value={caption} 
                            onChange={e => setCaption(e.target.value)}
                        />
                        <Button 
                            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold h-12 rounded-xl"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="animate-spin mr-2"/> : null}
                            {uploading ? 'Uploading...' : 'Post Short'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {shorts.length === 0 && <div className="flex h-full items-center justify-center text-zinc-500 flex-col gap-2"><p>No Shorts Yet</p></div>}
            
            {shorts.map((short) => (
                <ShortItem 
                    key={short.id} 
                    short={short} 
                    session={session} 
                    onDelete={handleDelete}
                    onShare={onShare} 
                />
            ))}
        </div>
    )
}