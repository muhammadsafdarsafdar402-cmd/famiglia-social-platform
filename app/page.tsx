"use client"

import '@/lib/i18n'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Settings, LogOut, Home, ThumbsUp, Film, Users, Zap, Calendar, ShoppingBag, Grid, Tv, Phone, Video, Heart, Share2, MessageCircle, Play, Volume2, VolumeX, Trash2, HelpCircle, Briefcase, Gamepad2, X } from "lucide-react"
import { useEmojiSystem } from '@/lib/useEmojiSystem' // <--- IMPORT THE HOOK
// --- COMPONENT IMPORTS ---
import AuthPage from '@/components/AuthPage'
import CreatePost from '@/components/CreatePost'
import ProfileSheet from '@/components/ProfileSheet'
import ChatSheet from '@/components/ChatSheet'
import NotificationBell from '@/components/NotificationBell'
import ShortsFeed from '@/components/ShortsFeed'
import StoriesFeed from '@/components/StoriesFeed'
import GroupsFeed from '@/components/GroupsFeed'
import EventsFeed from '@/components/EventsFeed'
import MallFeed from '@/components/Mallfeed'
import LiveDashboard from '@/components/LiveDashboard'
import CallOverlay from '@/components/CallOverlay'
import SettingsPanel from '@/components/SettingsPanel'
import { IncomingRequests, SidebarChatWidget, SuggestedFriends } from '@/components/FriendWidgets'
import ChatDashboard from '@/components/ChatDashboard'
import SuiteHub from '@/components/SuiteHub'
import TvEmbed from '@/components/TvEmbed'
import ReactionDock from '@/components/ReactionDock'
import ShareDialog from '@/components/ShareDialog'
import AppGuide from '@/components/AppGuide'
import WebsiteTour, { TourStep } from '@/components/WebsiteTour'




function ComingSoon({ title, icon: Icon ,image, description }: { title: string, icon: any, description: string , image : string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-3xl border border-zinc-100 shadow-sm text-center p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-32 h-32 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
              {image? <img src={image} alt="" className="w-32 h-auto"  /> :  <Icon className="w-10 h-10 text-yellow-500" />}
            </div>
            <h2 className="text-3xl font-black text-zinc-900 mb-2">{title}</h2>
            <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Coming Soon</span>
            </div>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">{description}</p>
            <div className="mt-8 flex gap-2">
                {/* <Button variant="outline" className="rounded-full border-zinc-200">Notify Me</Button>
                <Button className="rounded-full bg-zinc-900 text-white">Join Waitlist</Button> */}
            </div>
        </div>
    )
}
// --- 1. VIDEO PLAYER HELPER (OUTSIDE) ---
function CustomVideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) { videoRef.current.pause(); setIsPlaying(false) }
        else { videoRef.current.play(); setIsPlaying(true) }
    }

    return (
        <div className="relative w-full flex justify-center bg-black cursor-pointer group" onClick={togglePlay}>
            <video ref={videoRef} src={src} className="max-h-[500px] w-full object-contain" loop playsInline muted={isMuted} />
            {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><div className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white"><Play className="w-8 h-8 fill-current" /></div></div>}
            <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted) } }} className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
        </div>
    )
}

// --- 2. REAL POSTS FEED (OUTSIDE PAGE COMPONENT - CRITICAL FIX) ---
function RealPostsFeed(
    { session, onShare, deepLink, onViewProfile, userMode }:
        { session: any, onShare: (post: any) => void, deepLink?: string | null, onViewProfile: (id: string) => void, userMode: string }) {
    const { t } = useTranslation()
    const [posts, setPosts] = useState<any[]>([])
    const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
    const [comments, setComments] = useState<any[]>([])
    const [commentText, setCommentText] = useState('')

    // Scroll Logic
    useEffect(() => {
        if (!deepLink) return

        // Function to try finding and scrolling to the post
        const tryScroll = () => {
            const element = document.getElementById(`post-${deepLink}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.classList.add('ring-4', 'ring-yellow-400', 'transition-all', 'duration-1000')
                setTimeout(() => element.classList.remove('ring-4', 'ring-yellow-400'), 2500)
                return true // Found
            }
            return false // Not found
        }

        // If post exists, scroll immediately
        if (tryScroll()) return

        // If not, fetch it specifically
        const fetchSpecificPost = async () => {
            const { data } = await supabase.from('posts').select(`*, profiles(username, avatar_url), post_likes(user_id), post_comments(count)`).eq('id', deepLink).single()
            if (data) {
                // Add to top of list
                const formatted = { ...data, isLiked: data.post_likes?.some((l: any) => l.user_id === session.user.id), likeCount: data.post_likes?.length, commentCount: data.post_comments[0].count }
                setPosts(prev => {
                    // Prevent duplicates
                    if (prev.some(p => p.id === formatted.id)) return prev
                    return [formatted, ...prev]
                })
            }
        }
        fetchSpecificPost()

        // Retry scrolling for 2 seconds (in case it's rendering)
        const interval = setInterval(() => {
            if (tryScroll()) clearInterval(interval)
        }, 500)

        // Cleanup interval after 3 seconds
        const timeout = setTimeout(() => clearInterval(interval), 3000)

        return () => { clearInterval(interval); clearTimeout(timeout) }
    }, [deepLink])
    const tierLevel = 5;
    const isVip = tierLevel >= 5 // Define what tier counts as "VIP"
    const { currentPack, accessiblePacks } = useEmojiSystem(session?.user?.id, isVip)
    // const { currentPack } = useEmojiSystem(session?.user?.id)
    useEffect(() => {
        fetchPosts()
        const channel = supabase.channel('posts_feed').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchPosts() {
        const { data } = await supabase
            .from('posts')
            .select(`
            *, 
            profiles(username, avatar_url), 
            post_likes(user_id),             
            post_reactions(emoji, user_id),   
            post_comments(count)
        `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setPosts(data.map(p => {
                // 1. LIKE LOGIC (The Heart)
                const isLiked = p.post_likes.some((l: any) => l.user_id === session.user.id)
                const likeCount = p.post_likes.length

                // 2. REACTION LOGIC (The Emojis)
                const myReaction = p.post_reactions.find((r: any) => r.user_id === session.user.id)?.emoji

                // Group distinct reactions for display (e.g., 🦁 x3, 🔥 x2)
                const reactionCounts = p.post_reactions.reduce((acc: any, curr: any) => {
                    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1
                    return acc
                }, {})

                return {
                    ...p,
                    isLiked,        // Boolean: Have I liked it?
                    likeCount,      // Number: Total hearts
                    myReaction,     // String: My emoji (if any)
                    reactionCounts, // Object: { '🦁': 2, '🔥': 5 }
                    commentCount: p.post_comments[0].count
                }
            }))
        }
    }

    const handleDeletePost = async (postId: number) => {
        if (!confirm("Delete post?")) return
        await supabase.from('posts').delete().eq('id', postId)
        setPosts(prev => prev.filter(p => p.id !== postId))
    }

    const handleLike = async (post: any) => {
        const isLiked = post.isLiked
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !isLiked, likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p))
        if (isLiked) await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: session.user.id })
        else await supabase.from('post_likes').insert({ post_id: post.id, user_id: session.user.id })
    }

    const toggleComments = async (postId: number) => {
        if (expandedPostId === postId) setExpandedPostId(null)
        else {
            setExpandedPostId(postId)
            const { data } = await supabase.from('post_comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true })
            if (data) setComments(data)
        }
    }
    const formatTimeAgo = (date: string) => {
        const d = new Date(date); const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    }
    const handleComment = async (post: any) => {
        if (!commentText.trim()) return
        const { data } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: session.user.id, content: commentText }).select('*, profiles(username, avatar_url)').single()
        if (data) setComments(prev => [...prev, data])
        setCommentText(''); setPosts(prev => prev.map(p => p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
    }

    const handleReaction = async (emoji: string, postId: number) => {
        // 1. Optimistic Update (Update UI instantly)
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p

            // Toggle Logic: If clicking same emoji -> remove it
            if (p.myReaction === emoji) {
                return { ...p, myReaction: null, likeCount: Math.max(0, p.likeCount - 1) }
            }

            // Switch Logic: If changing emoji -> update it
            const newCount = p.myReaction ? p.likeCount : p.likeCount + 1
            return { ...p, myReaction: emoji, likeCount: newCount }
        }))

        // 2. Database Update
        const currentPost = posts.find(p => p.id === postId)

        if (currentPost?.myReaction === emoji) {
            // DELETE REACTION
            await supabase.from('post_reactions').delete().match({ post_id: postId, user_id: session.user.id })
        } else {
            // UPSERT REACTION (Insert or Update)
            // Note: 'emoji' variable here contains the PATH string (e.g., "/icons/crown.png")
            const { error } = await supabase.from('post_reactions').upsert({
                post_id: postId,
                user_id: session.user.id,
                emoji: emoji
            }, { onConflict: 'user_id, post_id' })

            // Replace your error logging line with this:
            if (error) {
                console.error("FULL DB ERROR:", JSON.stringify(error, null, 2))
            }
        }
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden relative group scroll-mt-24">
                    <div className="flex items-center gap-3 p-5">
                        <Avatar onClick={() => onViewProfile(post.user_id)} className="cursor-pointer"><AvatarImage src={post.profiles?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                        <div><span className="font-bold text-sm block">{post.profiles?.username}</span><span className="text-xs text-zinc-400 flex items-center gap-1">{formatTimeAgo(post.created_at)}</span></div>
                        {session.user.id === post.user_id && <button onClick={() => handleDeletePost(post.id)} className="absolute top-5 right-5 text-zinc-300 hover:text-red-500 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    <div className="px-5 pb-3"><p className="text-zinc-700">{post.content}</p></div>
                    {post.media_url && <div className="w-full bg-black flex justify-center">{post.media_type === 'video' ? <CustomVideoPlayer src={post.media_url} /> : <img src={post.media_url} className="max-h-[500px] object-contain" />}</div>}
                    <div className="px-4 pb-2">

                    </div>
                    {/* --- ACTION BAR --- */}
                    <div className="px-5 py-4 border-t border-zinc-50 flex items-center justify-between">

                        <div className="flex gap-4">
                            {/* 1. LIKE BUTTON (Heart) */}
                            {/* <button
                                onClick={() => handleLike(post)}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-blue-500' : 'text-zinc-500 hover:text-blue-500'}`}
                            >
                                <ThumbsUp className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                <span>{post.likeCount > 0 ? post.likeCount : t('likes')}</span>      
                            </button> */}

                            {/* 2. REACTION DOCK (Smile) */}
                            <div className="flex items-center gap-2">
                                <ReactionDock
                                    onReact={(emoji) => handleReaction(emoji, post.id)}
                                    variant="inline"
                                    activePack={currentPack} // Pass the user's active pack ID string
                                    currentReaction={post.myReaction}
                                />

                                {/* VISUAL REACTION DISPLAY (Tiny Icons) */}
                                {post.reactionCounts && Object.keys(post.reactionCounts).length > 0 && (
                                    <div className="flex -space-x-1 ml-2">
                                        {Object.entries(post.reactionCounts).slice(0, 4).map(([emoji, count]: any) => (
                                            <div key={emoji} className="bg-zinc-50 rounded-full border border-white w-6 h-6 flex items-center justify-center text-xs shadow-sm z-10" title={`${count} reactions`}>
                                                {(emoji.startsWith('/') || emoji.startsWith('http')) ? (
                                                    <img src={emoji} className="w-4 h-4 object-contain" />
                                                ) : (
                                                    <span>{emoji}</span>
                                                )}                                            </div>
                                        ))}
                                        {Object.keys(post.reactionCounts).length > 4 && (
                                            <div className="bg-zinc-100 rounded-full border border-white w-6 h-6 flex items-center justify-center text-[9px] font-bold text-zinc-500 z-0">
                                                +
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 3. COMMENT BUTTON */}
                            <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-zinc-500 text-sm font-medium hover:text-zinc-900">
                                <MessageCircle className="h-5 w-5" />
                                <span className="hidden sm:inline">{t('comment')}</span>        </button>
                        </div>

                        {/* SHARE BUTTON */}
                        <button onClick={() => onShare(post)} className="text-zinc-400 hover:text-zinc-600">
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                    {expandedPostId === post.id && (
                        <div className="bg-zinc-50 p-4 border-t border-zinc-100">
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                {comments.map(c => (<div key={c.id} className="flex gap-2"><Avatar className="h-6 w-6"><AvatarImage src={c.profiles?.avatar_url} /></Avatar><div className="bg-white p-2 rounded-xl text-xs shadow-sm"><span className="font-bold mr-1">{c.profiles?.username}</span>{c.content}</div></div>))}
                            </div>
                            <div className="flex gap-2"><input className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment(post)} /><Button size="sm" onClick={() => handleComment(post)} className="rounded-full bg-zinc-900 text-white hover:bg-black">Post</Button></div>
                        </div>
                    )}

                </div>

            ))}
        </div>
    )
}

// --- 3. BACKGROUND COMPONENTS ---
function BackgroundArt() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-yellow-400/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow" />
            <div className="absolute -bottom-[10%] -left-[5%] w-[500px] h-[500px] bg-yellow-400/70 rounded-full blur-[120px] mix-blend-multiply" />
        </div>
    )
}

function AppLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
    const { t } = useTranslation(); // You need to add this hook to AppLogo or pass it down
    const scales = { sm: "scale-75", md: "scale-100", lg: "scale-125", xl: "scale-150" }
    return (
        <div className={`flex items-center gap-3 ${scales[size]} origin-left select-none`}>
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-yellow-400 rounded-full rounded-tr-none rotate-45 shadow-[0_0_15px_rgba(250,204,21,0.3)]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
            </div>
            <div className="leading-none">
                <span className="block text-[10px] text-zinc-400 font-serif tracking-[0.2em] uppercase">famiglia</span>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 tracking-wide drop-shadow-sm">ORO</span>
                    <div className="bg-gradient-to-br from-zinc-700 to-zinc-900 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] border border-yellow-500/20">CS</div>
                </div>
                <span className="block text-[9px] text-zinc-500 font-medium tracking-tighter">{t('appTagline')}</span>
            </div>
        </div>
    )
}

// --- 4. MAIN PAGE COMPONENT ---
export default function Page() {
    const { t } = useTranslation()
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("feed")
    const [globalSearch, setGlobalSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any>({ products: [], events: [], people: [], groups: [] })
    const [showDropdown, setShowDropdown] = useState(false)
    const [activeEmojiPack, setActiveEmojiPack] = useState('classic')
    // UI States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [chatReceiver, setChatReceiver] = useState<any>(null)
    const [chatGroup, setChatGroup] = useState<any>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [activeCall, setActiveCall] = useState<any>(null)
    const [incomingCall, setIncomingCall] = useState<any>(null)
    const [isGuideOpen, setIsGuideOpen] = useState(false) // <--- 2. GUIDE STATE
    // Inside Page() function:
    const [viewProfileId, setViewProfileId] = useState<string | null>(null) // New State
    // Share & Deep Link State
    const [shareData, setShareData] = useState<{ type: string, data: any } | null>(null)
    const [deepLink, setDeepLink] = useState<{ type: string, id: string } | null>(null)
    const [isTourOpen, setIsTourOpen] = useState(false) // <--- TOUR STATE
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // NEW
const [isMobileWidgetsOpen, setIsMobileWidgetsOpen] = useState(false) // NEW
    const refreshSession = async () => { const { data } = await supabase.auth.refreshSession(); if (data.session) setSession(data.session) }

    const TOUR_STEPS: TourStep[] = [
        {
            targetId: 'header-left',
            title: t('home'),
            description: t('tour_home_desc'),
            position: 'bottom'
        },
        {
            targetId: 'global-search',
            title: t('search_placeholder'),
            description: t('tour_search_desc'),
            position: 'bottom'
        },
        {
            targetId: 'nav-sidebar',
            title: t('menu'),
            description: t('tour_nav_desc'),
            position: 'right' // <--- Set to RIGHT for left sidebar
        },
        {
            targetId: 'app-tabs',
            title: t('creatorSuite'),
            description: t('tour_app_desc'),
            position: 'bottom'
        },
        {
            targetId: 'right-sidebar',
            title: t('widget_trending'),
            description: t('tour_community_desc'),
            position: 'left' // <--- Set to LEFT for right sidebar
        },
        {
            targetId: 'header-actions',
            title: t('notifications'),
            description: t('tour_notify_desc'),
            position: 'left'
        }
    ]
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session)
                // Auth check logic (omitted for brevity, keep your existing logic here)
                // Inside your auth useEffect
                supabase.from('profiles')
                    .select('active_emoji_pack')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => {
                        if (data?.active_emoji_pack) setActiveEmojiPack(data.active_emoji_pack)
                    })
                setLoading(false)
            } else { setLoading(false) }
        })
    }, [])
    const handleViewProfile = (id: string) => {
        setViewProfileId(id)
    }
    const handleOpenShare = (type: string, data: any) => { setShareData({ type, data }) }
// UPDATE THIS FUNCTION IN YOUR MAIN Page() COMPONENT
    const handleLogout = async () => { 
        // 1. Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error("Logout Error:", error.message);
        }

        // 2. Clear local session state immediately to trigger re-render
        setSession(null); 

        // 3. Clear any local storage if you use it custom (Supabase does this automatically usually)
        // localStorage.removeItem('sb-...-auth-token'); 

        // 4. Force reload to ensure a clean slate (optional but recommended for clean cleanup)
        window.location.href = "/"; 
    }
        const startCall = (target: any, isVideo: boolean) => { /* call logic */ }
    const openGlobalChat = () => { setChatGroup(null); setChatReceiver(null); setIsChatOpen(true) }
    const openGroupChat = (group: any) => { setChatGroup(group); setChatReceiver(null); setIsChatOpen(true) }
    const openPrivateChat = (targetUser: any) => { setChatReceiver(targetUser); setChatGroup(null); setIsChatOpen(true) }

    // --- DEEP LINK NAVIGATION ---
    const handleDeepLinkNavigation = (type: string, id: string) => {
        console.log("Navigating to:", type, id)
        if (type === 'product') setActiveTab('mall')
        else if (type === 'event') setActiveTab('events')
        else if (type === 'short') setActiveTab('shorts')
        else if (type === 'post') setActiveTab('feed')

        setDeepLink({ type, id })
        setTimeout(() => setDeepLink(null), 3000)
    }

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-400 animate-pulse">Loading App...</div>
    if (!session) return <AuthPage onLogin={() => { }} />

    return (
        <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans pb-20 lg:pb-0 selection:bg-yellow-100 relative">
            <BackgroundArt />
            {/* <FeatureTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        steps={TOUR_STEPS} 
      />    */}
            <ShareDialog
                isOpen={!!shareData}
                onClose={() => setShareData(null)}
                item={shareData}
                session={session}
            />
            <WebsiteTour
                steps={TOUR_STEPS}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
            />

            {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} onLogout={handleLogout} />}
            {activeCall && <CallOverlay session={session} activeCall={activeCall} onEndCall={() => setActiveCall(null)} />}
<header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 h-auto backdrop-blur-xl">
    <div className="mx-auto max-w-7xl flex h-16 overflow-hidden items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* LOGO SECTION */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}>
            <img 
                src="/icons/logo.jpg" 
                // Changed from h-10 to h-14 to fill the header height better
                className='h-32 w-32 md:w-40 md:h-40  p-4 object-contain rounded-xl' 
                alt="logo" 
            />                        
        </div>

        {/* SEARCH BAR */}
        <div className="hidden md:flex max-w-md flex-1 items-center px-8 relative">
            <div id="global-search" className="relative w-full z-50">              
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input 
                    placeholder={t('searchYourProductuct')} 
                    className="w-full rounded-full bg-zinc-100 py-2 pl-10 pr-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50" 
                    value={globalSearch} 
                    onChange={(e) => setGlobalSearch(e.target.value)} 
                />
            </div>
        </div>

        {/* ACTIONS */}
        <div id="header-actions" className="flex items-center gap-2">            
            <NotificationBell userId={session.user.id} />
            <Button variant="ghost" size="icon" onClick={() => setIsTourOpen(true)} className="text-zinc-500 hover:bg-zinc-100 hover:text-yellow-600 rounded-full">
                <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={openGlobalChat} className="text-zinc-500 hover:bg-zinc-100 hover:text-yellow-600 rounded-full">
                <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="ml-2 h-8 w-px bg-zinc-200"></div>
            <Avatar className="ml-2 h-9 w-9 cursor-pointer ring-2 ring-white shadow-sm hover:ring-yellow-200 transition-all" onClick={() => setIsProfileOpen(true)}>
                <AvatarImage src={session.user.user_metadata?.avatar_url} />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        </div>
    </div>
</header>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

                  <aside 
    id="nav-sidebar" 
    // FIX: Added h-[calc(100vh-100px)] to set height and overflow-y-auto to enable scroll
    className="hidden lg:block lg:col-span-3 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar"
>       
    <nav className="space-y-1">
        <NavItem activeImg='/icons/teasers.jpeg' inactiveImg='/icons/teasers.jpeg' icon={<Home />} label={t('home')} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
        <NavItem icon={<MessageSquare />} label={t('messages')} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        <NavItem activeImg='/icons/snippet.jpeg' inactiveImg='/icons/snippet.jpeg' icon={<Film />} label={t('shorts')} active={activeTab === 'shorts'} onClick={() => setActiveTab('shorts')} />
        <NavItem activeImg='/icons/group.png' inactiveImg='/icons/group.png' icon={<Users />} label={t('groups')} active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
        <NavItem activeImg='/icons/video_icon.svg' inactiveImg='/icons/video_icon.svg' icon={<Zap />} label={t('live')} active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <NavItem activeImg='/icons/event.png' inactiveImg='/icons/event.png' icon={<Calendar />} label={t('events')} active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
        <NavItem activeImg='/icons/global_nav.png' inactiveImg='/icons/global_nav.png' icon={<ShoppingBag />} label={t('globalMall')} active={activeTab === 'mall'} onClick={() => setActiveTab('mall')} />
        <NavItem activeImg='/icons/suit.jpeg' inactiveImg='/icons/suit.jpeg' icon={<Grid />} label={t('suiteHub')} active={activeTab === 'suite'} onClick={() => setActiveTab('suite')} />
        <NavItem activeImg='/icons/logo_nav.png' inactiveImg='/icons/logo_nav.png' icon={<Tv />} label={t('tvNetwork')} active={activeTab === 'tv'} onClick={() => setActiveTab('tv')} />
        
        {/* Expanded Items */}
        <NavItem activeImg='/icons/crm_black.jpeg' inactiveImg='/icons/crm_black.jpeg' icon={<Briefcase />} label={t('CRM')} active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} />
        <NavItem activeImg='/icons/promotion_black.jpeg' inactiveImg='/icons/promotion_black.jpeg' icon={<Briefcase />} label={t('Promotion')} active={activeTab === 'Promotion'} onClick={() => setActiveTab('Promotion')} />
        <NavItem activeImg='' inactiveImg='' icon={<Gamepad2 />} label={t('Train Station')} active={activeTab === 'Train-Station'} onClick={() => setActiveTab('Train-Station')} />
        <NavItem activeImg='/icons/challenge_black.jpeg' inactiveImg='/icons/challenge_black.jpeg' icon={<Briefcase />} label={t('Challenge Suite')} active={activeTab === 'Challenge-Suit'} onClick={() => setActiveTab('Challenge-Suit')} />

        <div className="my-4 h-px bg-zinc-200/50 mx-4"></div>
        
        <NavItem activeImg='/icons/home1.jpeg' inactiveImg='/icons/home1.jpeg' icon={<Briefcase />} label={t('bizNetworx')} active={activeTab === 'biz'} onClick={() => setActiveTab('biz')} />
        <NavItem activeImg='/icons/home2.jpeg' inactiveImg='/icons/home2.jpeg' icon={<Gamepad2 />} label={t('kidzHQ')} active={activeTab === 'kidz'} onClick={() => setActiveTab('kidz')} />
        
        <div className="pt-8 pb-10"> {/* Added pb-10 for bottom spacing */}
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('settings')}</h3>
            <div className="mt-2 space-y-1">
                <NavItem icon={<Settings />} label={t('mediaPreferences')} onClick={() => setIsSettingsOpen(true)} />
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-5 w-5" /> {t('lOGOUT')}</button>
            </div>
        </div>
    </nav>
</aside>
<main className={activeTab === 'chat' ? "lg:col-span-9 md:col-span-9" : "lg:col-span-6 md:col-span-6 space-y-6"}>                        <Tabs value={activeTab} onValueChange={setActiveTab} className=" w-full">
                            {activeTab !== 'chat' && (
                              <TabsList id="app-tabs"
    className="w-full bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 h-auto grid grid-cols-5 gap-2 mb-6"
>      <TabsTrigger
                                        value="feed" className="group flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"                                    >
                                        <img
                                            src="/icons/teasers.jpeg"
                                            alt="Home"
                                            className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                        />
                                        {t('home')}
                                    </TabsTrigger>
                                    <TabsTrigger value="shorts" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/snippet.jpeg"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('shorts')}</TabsTrigger>
                                    <TabsTrigger value="groups" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/group.png"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('groups')}</TabsTrigger>
                                    <TabsTrigger value="live" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/video_icon.svg"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('live')}</TabsTrigger>
                                    <TabsTrigger value="events" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/event.png"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('events')}</TabsTrigger>
                                    {/* <TabsTrigger value="crm" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/crm.jpeg"
                                        alt="CRM"
                                        className="w-10 h-10 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('CRM')}</TabsTrigger> */}
                                    <TabsTrigger value="mall" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/global_nav.png"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('globalMall')}</TabsTrigger>
                                    <TabsTrigger value="suite" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/suit.jpg"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('suiteHub')}</TabsTrigger>
                                    <TabsTrigger value="tv" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/logo_nav.png"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('tvNetwork')}</TabsTrigger>
                                    <TabsTrigger value="biz" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/home1.jpeg"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('bizNetworx')}</TabsTrigger>
                                    <TabsTrigger value="kidz" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/home2.jpeg"
                                        alt="Home"
                                        className="w-11 h-11 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('kidzHQ')}</TabsTrigger>


                                     <TabsTrigger value="Challenge-Suit" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/challenge_suit.jpg"
                                        alt="Challenge Suit Logo"
                                        className="w-14 h-14 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('Challenge Suite')}</TabsTrigger>
                             {/*       <TabsTrigger value="Train-Station" className="flex flex-col items-center justify-center gap-2 w-full p-2 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:font-bold transition-all rounded-xl"> <img
                                        src="/icons/Train.jpeg"
                                        alt="Train-Station"
                                        className="w-10 h-10 object-contain" // <--- FIX APPLIED HERE
                                    /> {t('Train Station')}</TabsTrigger> */}
                                </TabsList>
                            )}

                            <TabsContent value="feed" className="space-y-6 focus-visible:outline-none">
                                <StoriesFeed user={session.user} />
                                <CreatePost user_id={session.user.id} />
                                <RealPostsFeed
                                    session={session}
                                    onShare={(post) => handleOpenShare('post', post)}
                                    deepLink={deepLink?.type === 'post' ? deepLink.id : null}
                                    onViewProfile={handleViewProfile}
                                    userMode={activeEmojiPack}
                                />
                            </TabsContent>

                            <TabsContent value="mall">
                                <MallFeed
                                    session={session}
                                    onChat={openPrivateChat}
                                    globalSearch={globalSearch}
                                    onShare={(item) => handleOpenShare('product', item)}
                                    deepLink={deepLink?.type === 'product' ? deepLink.id : null}
                                />
                            </TabsContent>

                            <TabsContent value="events">
                                <EventsFeed
                                    user={session.user}
                                    onShare={(event) => handleOpenShare('event', event)}
                                    deepLink={deepLink?.type === 'event' ? deepLink.id : null}
                                />
                            </TabsContent>

                            <TabsContent value="shorts">
                                <ShortsFeed
                                    session={session}
                                    onShare={(short) => handleOpenShare('short', short)}
                                    deepLink={deepLink?.type === 'short' ? deepLink.id : null}
                                />
                            </TabsContent>

                            <TabsContent value="groups"><GroupsFeed session={session} onChat={openGroupChat} /></TabsContent>
                            <TabsContent value="live"><LiveDashboard session={session} /></TabsContent>
                            <TabsContent value="chat"><ChatDashboard session={session} onCall={startCall} onNavigate={handleDeepLinkNavigation} /></TabsContent>
                            <TabsContent value="suite"><SuiteHub session={session} /></TabsContent>
                            <TabsContent value="tv"><TvEmbed /></TabsContent>
                            <TabsContent value="biz">
                                <ComingSoon
                                    title={t('bizNetworx')}
                                    icon={Briefcase}
                                    image='/icons/home1.jpeg'
                                    description={t('bizDescription') || "Coming Soon"}
                                />
                            </TabsContent>

                            <TabsContent value="kidz">
                                <ComingSoon
                                    title={t('kidzHQ')}
                                    image='/icons/home2.jpeg'
                                    icon={Gamepad2}
                                    description="A safe, fun, and interactive space for the younger generation. Games, educational content, and family-friendly entertainment."
                                />
                            </TabsContent>

                            <TabsContent value="crm">
                                <ComingSoon
                                    title={t('CRM')}
                                    image='/icons/crm.jpg'
                                    icon={Gamepad2}
                                    description="CRM"
                                />
                            </TabsContent>

                            <TabsContent value="Promotion">

                                <ComingSoon
                                    title={t('Promotion')}
                                    image='/icons/promotion.jpg'
                                    icon={Gamepad2}
                                    description="Promotion"
                                />
                            </TabsContent>
                            <TabsContent value="Train-Station">
                                <ComingSoon
                                    title={t('Train Station')}
                                    image=''
                                    icon={Gamepad2}
                                    description="Train Station"
                                />
                            </TabsContent>
                              <TabsContent value="Challenge-Suit">
                                <ComingSoon
                                    title={t('Challenge Suite')}
                                    image='/icons/challenge_suit.jpg'
                                    icon={Gamepad2}
                                    description="Challenge Suite"
                                />
                            </TabsContent>
                        </Tabs>
                    </main>

                    {activeTab !== 'chat' && (
                        <aside id="right-sidebar" className="hidden md:block md:col-span-3 lg:col-span-3 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
                                     <IncomingRequests session={session} />
                            <SidebarChatWidget session={session} onChat={openPrivateChat} />
                            <SuggestedFriends session={session} onViewProfile={handleViewProfile} />
                            {/* <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100"> */}
                            {/* <h3 className="font-bold text-zinc-900 mb-4">{t('widget_trending')}</h3> */}
                            {/* <div className="space-y-3">{['#FamigliaDoro', '#GoldStandard', '#CreatorEconomy'].map((tag) => (<div key={tag} className="flex justify-between items-center group cursor-pointer"><span className="text-sm text-zinc-600 group-hover:text-yellow-600 transition-colors">{tag}</span><span className="text-xs text-zinc-400">2.5k posts</span></div>))}</div> */}
                            {/* </div> */}
                        </aside>
                    )}
                </div>
            </div>

            <ChatSheet
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                session={session}
                receiver={chatReceiver}
                group={chatGroup}
                onCall={startCall}
                onNavigate={handleDeepLinkNavigation}
            />
            {/* Replace the old ProfileSheet line with this: */}
            <ProfileSheet
                isOpen={!!viewProfileId || isProfileOpen} // Open if viewing someone OR editing self
                onClose={() => {
                    setViewProfileId(null)
                    setIsProfileOpen(false)
                }}
                session={session}
                userId={viewProfileId || session.user.id} // If viewId exists, show them. Else show me.
                onProfileUpdate={refreshSession}
            />    </div>
    )
}

function NavItem({ icon, activeImg, inactiveImg, label, active = false, onClick }: {
    icon?: any,
    activeImg?: string,
    inactiveImg?: string, label: string, active?: boolean, onClick: () => void
}) {
    return <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-zinc-900 text-yellow-400 shadow-lg shadow-zinc-300' : ' hover:bg-white hover:text-yellow-600 hover:shadow-sm'}`}>
        <div className={`h-6 w-6 flex items-center justify-center shrink-0 ${active ? 'text-yellow-400' : 'text-zinc-400'}`}>
            {/* LOGIC: If active & has activeImg -> show Image. Else if inactive & has inactiveImg -> show Image. Else -> show Icon */}
            {active && activeImg ? (
                <img src={activeImg} alt={label} className="h-full w-full object-contain" />
            ) : !active && inactiveImg ? (
                <img src={inactiveImg} alt={label} className="h-full w-full object-contain opacity-70" />
            ) : (
                icon
            )}
        </div>    {label}</button>
}