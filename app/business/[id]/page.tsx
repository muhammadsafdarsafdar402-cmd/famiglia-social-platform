"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Calendar, MapPin, Globe, Mail, CheckCircle2, Edit, Save } from 'lucide-react'

// Import your existing feeds
import MallFeed from '@/components/Mallfeed'
import EventsFeed from '@/components/EventsFeed'

export default function BusinessProfileView() {
  const { id } = useParams()
  const [business, setBusiness] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        const { data } = await supabase.from('businesses').select('*').eq('id', id).single()
        setBusiness(data)
        setEditForm(data) // Initialize edit form
    }
    if(id) fetchData()
  }, [id])

  // Save Updates
  const handleSave = async () => {
      const { error } = await supabase.from('businesses').update({
          name: editForm.name,
          description: editForm.description,
          website: editForm.website,
          contact_email: editForm.contact_email
      }).eq('id', business.id)

      if(!error) {
          setBusiness(editForm)
          setIsEditOpen(false)
      }
  }

  if (!business) return <div className="p-10 text-center">Loading Page...</div>

  const isOwner = currentUser?.id === business.owner_id

  return (
    <div className="min-h-screen bg-white">
        {/* HERO BANNER */}
        <div className="h-64 w-full bg-zinc-900 relative group overflow-hidden">
            {business.banner_url && <img src={business.banner_url} className="w-full h-full object-cover opacity-90" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            
            {/* Owner Edit Button */}
            {isOwner && (
                <Button 
                    variant="secondary" 
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
                    onClick={() => setIsEditOpen(true)}
                >
                    <Edit className="w-4 h-4 mr-2"/> Edit Page
                </Button>
            )}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
                <Avatar className="w-40 h-40 border-4 border-white shadow-2xl bg-white rounded-3xl">
                    <AvatarImage src={business.logo_url} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold text-zinc-300">{business.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-4xl font-black text-white drop-shadow-lg">{business.name}</h1>
                        {business.verified && <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-900"/>}
                    </div>
                    <p className="text-white/90 font-medium mb-4 text-lg">@{business.handle} • <span className="opacity-70">{business.category}</span></p>
                    
                    {!isOwner && (
                        <div className="flex gap-3">
                            <Button className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-10 px-6">Follow</Button>
                            <Button variant="outline" className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 h-10">Message</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT TABS */}
            <Tabs defaultValue="shop" className="space-y-8">
                <TabsList className="bg-zinc-100 p-1.5 rounded-2xl w-full md:w-auto inline-flex h-auto">
                    <TabsTrigger value="shop" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Store</TabsTrigger>
                    <TabsTrigger value="events" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Events</TabsTrigger>
                    <TabsTrigger value="about" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">About</TabsTrigger>
                </TabsList>

                {/* 1. SHOP TAB (Reusing MallFeed) */}
                <TabsContent value="shop">
                    {/* We pass the businessId to MallFeed so it knows to filter by this business OR allow creating for this business */}
                    <MallFeed 
                        session={{ user: currentUser }} 
                        onChat={() => {}} 
                        onShare={() => {}} 
                        // IMPORTANT: You need to update MallFeed to accept a 'businessId' prop 
                        // and filter products by `business_id` instead of just global search.
                        // For now, it shows everything, but in the real app, you filter the query.
                    />
                </TabsContent>

                {/* 2. EVENTS TAB (Reusing EventsFeed) */}
                <TabsContent value="events">
                    <EventsFeed 
                        user={currentUser} 
                        onShare={() => {}} 
                        // IMPORTANT: Pass 'businessId={business.id}' here
                    />
                </TabsContent>

                {/* 3. ABOUT TAB */}
                <TabsContent value="about" className="max-w-2xl">
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">About Us</h3>
                            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-lg">{business.description || "No description available."}</p>
                        </div>
                        <div className="flex flex-col gap-3 pt-6 border-t border-zinc-100">
                            {business.contact_email && <div className="flex items-center gap-3 text-zinc-600"><div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center"><Mail className="w-5 h-5"/></div> {business.contact_email}</div>}
                            {business.website && <div className="flex items-center gap-3 text-zinc-600"><div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center"><Globe className="w-5 h-5"/></div> <a href={business.website} target="_blank" className="hover:underline text-blue-600">{business.website}</a></div>}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        {/* EDIT MODAL */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Business Details</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">Name</label>
                        <Input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">Description</label>
                        <Textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500">Website</label>
                            <Input value={editForm.website || ''} onChange={e => setEditForm({...editForm, website: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500">Email</label>
                            <Input value={editForm.contact_email || ''} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} />
                        </div>
                    </div>
                    <Button onClick={handleSave} className="w-full bg-black text-white"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}