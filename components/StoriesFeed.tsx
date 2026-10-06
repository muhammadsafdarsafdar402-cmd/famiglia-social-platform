import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Clock, Loader2, CheckCircle2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import ReactionDock from './ReactionDock' // Ensure this component exists
import { useEmojiSystem } from '@/lib/useEmojiSystem'

function formatTimeAgo(dateString: string) {
  const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return '1d' 
}

export default function StoriesFeed({ user }: { user: any }) {
    const [stories, setStories] = useState<any[]>([])
    const [viewingStory, setViewingStory] = useState<any>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const tierLevel = 5;
    const isVip = tierLevel >= 5 ;
        const { currentPack } = useEmojiSystem(user?.id ,isVip)
    
    useEffect(() => {
        const fetchStories = async () => {
            // Fetch stories from last 24 hours
            const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
            const { data } = await supabase.from('stories').select('*, profiles(username, avatar_url)').gt('created_at', yesterday).order('created_at', { ascending: false })
            if (data) setStories(data)
        }
        fetchStories()
    }, [])

    const handleUpload = async (e: any) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadStatus('uploading')
        
        try {
            // FIX: Add file extension to filename (Crucial for Supabase Storage)
            const fileExt = file.name.split('.').pop()
            const fileName = `stories/${user.id}_${Date.now()}.${fileExt}`

            // 1. Upload
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file)
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
            
            // 2. Save to DB
            const { data: newStory, error: dbError } = await supabase.from('stories').insert({
                user_id: user.id,
                media_url: urlData.publicUrl
            }).select('*, profiles(username, avatar_url)').single()

            if (dbError) throw dbError
            
            // 3. Update UI
            setStories(prev => [newStory, ...prev])
            setUploadStatus('success')
            
            // Reset button state
            setTimeout(() => setUploadStatus('idle'), 2000)

        } catch (err: any) {
            console.error("Upload Error:", err)
            alert("Failed to upload story. Check console for details.")
            setUploadStatus('idle')
        }
    }

    const handleDelete = async (storyId: number) => {
        if (!confirm("Delete this story?")) return
        await supabase.from('stories').delete().eq('id', storyId)
        setStories(prev => prev.filter(s => s.id !== storyId))
        setViewingStory(null)
    }

    const handleReaction = async (storyId: number, emoji: string) => {
        await supabase.from('story_reactions').insert({
            story_id: storyId,
            user_id: user.id,
            emoji: emoji
        })
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 items-center">
            {/* ADD BUTTON */}
            <div className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer relative">
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all relative overflow-hidden shrink-0 ${uploadStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100'}`}>
                    {uploadStatus === 'idle' && <Plus className="w-6 h-6 text-zinc-400" />}
                    {uploadStatus === 'uploading' && <Loader2 className="animate-spin w-5 h-5 text-yellow-500"/>}
                    {uploadStatus === 'success' && <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in"/>}
                    <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploadStatus !== 'idle'}/>
                </div>
                <span className={`text-xs font-medium ${uploadStatus === 'success' ? 'text-green-600 font-bold' : 'text-zinc-500'}`}>
                    {uploadStatus === 'uploading' ? 'Posting...' : uploadStatus === 'success' ? 'Posted!' : 'Add Story'}
                </span>
            </div>

            {/* STORIES LIST */}
            {stories.map(story => (
                <Dialog key={story.id} open={viewingStory?.id === story.id} onOpenChange={(o) => o ? setViewingStory(story) : setViewingStory(null)}>
                    <DialogTrigger asChild>
                        <div className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group">
                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-orange-600 group-hover:scale-105 transition-transform shrink-0">
                                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-black flex items-center justify-center">
                                    {story.media_url.match(/\.(mp4|webm|mov)$/i) ? 
                                        <video src={story.media_url} className="w-full h-full object-cover pointer-events-none" /> : 
                                        <img src={story.media_url} className="w-full h-full object-cover" />
                                    }
                                </div>
                            </div>
                            <span className="text-xs font-medium text-zinc-700 truncate w-16 text-center">{story.profiles?.username}</span>
                        </div>
                    </DialogTrigger>
                    
                    <DialogContent className="p-0 border-none bg-black text-white h-[80vh] max-w-sm flex flex-col overflow-hidden rounded-3xl outline-none shadow-2xl">
                        <div className="relative flex-1 bg-black flex items-center justify-center">
                            
                            {/* CONTENT DISPLAY */}
                            {story.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video src={story.media_url} autoPlay playsInline controls={false} className="max-h-full max-w-full" />
                            ) : (
                                <img src={story.media_url} className="max-h-full max-w-full object-contain" />
                            )}

                            {/* REACTION DOCK (FLOATING BOTTOM) */}
                            <div className="absolute bottom-6 left-0 right-0 z-30 px-4">
                                <ReactionDock activePack={currentPack} onReact={(emoji) => handleReaction(story.id, emoji)} variant="floating" />
                            </div>

                            {/* HEADER OVERLAY (User Info, Time, Close/Delete) */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-white/20 shadow-md">
                                        <AvatarImage src={story.profiles?.avatar_url}/>
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold shadow-black drop-shadow-md leading-none">{story.profiles?.username}</p>
                                        <p className="text-[10px] opacity-80 flex items-center gap-1 shadow-black drop-shadow-md mt-0.5">
                                            <Clock className="w-3 h-3"/> {formatTimeAgo(story.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Delete Button (Owner Only) */}
                                    {user.id === story.user_id && (
                                        <Button variant="ghost" size="icon" className="hover:bg-red-500/20 text-white hover:text-red-500 rounded-full h-8 w-8 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }}>
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    )}
                                    
                                    {/* Close Button */}
                                    <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white rounded-full h-8 w-8 backdrop-blur-sm" onClick={() => setViewingStory(null)}>
                                        <X className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    )
}