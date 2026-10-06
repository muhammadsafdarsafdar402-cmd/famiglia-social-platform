"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, MessageCircle, Settings, Trash2, UserMinus, Save, Loader2, LogOut } from 'lucide-react'

export default function GroupsFeed({ session, onChat }: { session: any, onChat: (group: any) => void }) {
  const [groups, setGroups] = useState<any[]>([])
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set()) // Use String Set
  const [newGroupName, setNewGroupName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  
  // Admin State
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => { 
    if (session?.user?.id) fetchGroups() 
  }, [session.user.id])

  async function fetchGroups() {
    // 1. Fetch all available communities
    const { data: allGroups, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (allGroups) setGroups(allGroups)

    // 2. Fetch specific memberships for this user
    const { data: membersData, error: memErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id)
    
    if (membersData) {
        // NORMALIZATION: Ensure every ID is a string before putting in the Set
        const normalizedIds = new Set(membersData.map(m => String(m.group_id)))
        setMyGroupIds(normalizedIds)
    }
  }

  const joinGroup = async (groupId: any) => {
    const stringId = String(groupId)
    setLoadingAction(stringId)
    
    const { error } = await supabase.from('group_members').insert({ 
        group_id: groupId, 
        user_id: session.user.id,
        role: 'member'
    })

    // If successful OR if already a member (Unique constraint error 23505)
    if (!error || error.code === '23505') {
        setMyGroupIds(prev => {
            const next = new Set(prev)
            next.add(stringId)
            return next
        })
    } else {
        console.error("Join failed:", error.message)
    }
    setLoadingAction(null)
  }

  const leaveGroup = async (groupId: any) => {
      const stringId = String(groupId)
      if(!confirm("Are you sure you want to leave this community?")) return
      setLoadingAction(stringId)
      
      const { error } = await supabase.from('group_members')
        .delete()
        .match({ group_id: groupId, user_id: session.user.id })

      if (!error) {
          setMyGroupIds(prev => {
              const next = new Set(prev)
              next.delete(stringId)
              return next
          })
      }
      setLoadingAction(null)
  }

  // --- ADMIN SETTINGS LOGIC ---
  const openSettings = async (group: any) => {
    setSelectedGroup(group)
    setEditName(group.name)
    setIsSettingsOpen(true)
    const { data } = await supabase.from('group_members').select('user_id, profiles(username, avatar_url)').eq('group_id', group.id)
    if (data) setMembers(data)
  }

  const handleUpdateName = async () => {
    const { error } = await supabase.from('groups').update({ name: editName }).eq('id', selectedGroup.id)
    if (!error) {
        setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, name: editName } : g))
        setIsSettingsOpen(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    const { error } = await supabase.from('group_members').delete().match({ group_id: selectedGroup.id, user_id: userId })
    if (!error) setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  return (
    <div className="space-y-6">
        {/* HEADER AREA */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2 text-zinc-800"><Users className="text-yellow-500"/> Communities</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button className="rounded-full bg-zinc-900 hover:bg-black text-white shadow-lg"><Plus className="w-4 h-4 mr-2 text-yellow-400"/> Create Community</Button></DialogTrigger>
                <DialogContent className="rounded-3xl">
                    <DialogHeader><DialogTitle>New Group</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Input placeholder="Community Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <Button onClick={async () => {
                            const { data } = await supabase.from('groups').insert({ name: newGroupName, created_by: session.user.id, image_url: `https://ui-avatars.com/api/?name=${newGroupName}&background=FACC15&color=000` }).select().single()
                            if (data) { 
                                setGroups(prev => [data, ...prev])
                                await joinGroup(data.id)
                                setNewGroupName(''); setIsDialogOpen(false) 
                            }
                        }} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 rounded-xl">Launch</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {/* COMMUNITIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
                // IMPORTANT: Normalizing comparison
                const gId = String(group.id)
                const isMember = myGroupIds.has(gId)
                const isAdmin = group.created_by === session.user.id

                return (
                    <Card key={group.id} className="p-5 flex items-center gap-4 rounded-3xl border border-zinc-100 shadow-sm bg-white hover:shadow-md transition-all">
                        <Avatar className="h-16 w-16 rounded-2xl border border-zinc-50 shadow-sm">
                            <AvatarImage src={group.image_url} />
                            <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-zinc-900 truncate">{group.name}</h3>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                                {isAdmin ? "Owner" : isMember ? "Member" : "Public"}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            {/* IF MEMBER (OR ADMIN): SHOW CHAT BUTTON */}
                            {(isMember || isAdmin) ? (
                                <>
                                    <Button size="sm" variant="secondary" className="rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold" onClick={() => onChat(group)}>
                                        <MessageCircle className="w-4 h-4 mr-1"/> Chat
                                    </Button>
                                    {!isAdmin && (
                                        <Button size="sm" variant="ghost" className="rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 h-7 text-[10px]" onClick={() => leaveGroup(group.id)}>
                                            <LogOut className="w-3 h-3 mr-1"/> Leave
                                        </Button>
                                    )}
                                </>
                            ) : (
                                /* IF NOT MEMBER: SHOW JOIN BUTTON */
                                <Button 
                                    size="sm" 
                                    className="rounded-full bg-zinc-900 text-white hover:bg-black font-bold px-6" 
                                    onClick={() => joinGroup(group.id)}
                                    disabled={loadingAction === gId}
                                >
                                    {loadingAction === gId ? <Loader2 className="w-4 h-4 animate-spin"/> : "Join"}
                                </Button>
                            )}
                            
                            {/* ADMIN SETTINGS ICON */}
                            {isAdmin && (
                                <Button size="sm" variant="ghost" className="rounded-full text-zinc-400 hover:text-zinc-900 h-7 text-[10px]" onClick={() => openSettings(group)}>
                                    <Settings className="w-3 h-3 mr-1"/> Manage
                                </Button>
                            )}
                        </div>
                    </Card>
                )
            })}
        </div>
        
        {/* --- SETTINGS DIALOG --- */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Rename Community</label>
                        <div className="flex gap-2">
                            <Input value={editName} onChange={e => setEditName(e.target.value)} />
                            <Button size="icon" onClick={handleUpdateName} className="bg-zinc-900 text-white shrink-0"><Save className="w-4 h-4"/></Button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Members ({members.length})</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide">
                            {members.map((m: any) => (
                                <div key={m.user_id} className="flex items-center justify-between p-2 bg-zinc-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7"><AvatarImage src={m.profiles?.avatar_url}/></Avatar>
                                        <span className="text-xs font-medium text-zinc-700">{m.profiles?.username}</span>
                                    </div>
                                    {m.user_id !== session.user.id && (
                                        <Button size="icon" variant="ghost" onClick={() => handleRemoveMember(m.user_id)} className="h-7 w-7 text-zinc-300 hover:text-red-500"><UserMinus className="w-3 h-3"/></Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button variant="destructive" className="w-full rounded-xl h-12 font-bold" onClick={async () => {
                        if(confirm("Delete this community forever?")) {
                            await supabase.from('groups').delete().eq('id', selectedGroup.id)
                            setGroups(prev => prev.filter(g => g.id !== selectedGroup.id))
                            setIsSettingsOpen(false)
                        }
                    }}><Trash2 className="w-4 h-4 mr-2"/> Delete Community</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}