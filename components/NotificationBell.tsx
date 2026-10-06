import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from 'lucide-react'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
      (payload) => {
        setHasUnread(true)
        fetchNotifications() // Refresh list
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*, sender:sender_id(username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setNotifications(data)
  }

  const markRead = async () => {
    setHasUnread(false)
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
  }

  return (
    <Popover onOpenChange={(open) => open && markRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:bg-zinc-100 rounded-full">
            <Bell className="h-5 w-5" />
            {hasUnread && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white shadow-xl border-zinc-100 rounded-xl overflow-hidden" align="end">
         <div className="p-3 border-b bg-zinc-50 font-bold text-sm">Notifications</div>
         <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? <p className="p-4 text-xs text-zinc-400 text-center">No new notifications</p> : (
                notifications.map(n => (
                    <div key={n.id} className={`flex items-center gap-3 p-3 hover:bg-zinc-50 border-b border-zinc-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                        <Avatar className="h-8 w-8"><AvatarImage src={n.sender?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className="flex-1">
                            <p className="text-sm text-zinc-800">
                                <span className="font-bold">{n.sender?.username}</span> 
                                {n.type === 'friend_request' && " sent you a friend request."}
                                {n.type === 'new_story' && " added to their story."}
                                {n.type === 'like' && " liked your post."}
                                {n.type === 'comment' && " commented on your post."}
                            </p>
                            <p className="text-[10px] text-zinc-400">{new Date(n.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))
            )}
         </div>
      </PopoverContent>
    </Popover>
  )
}