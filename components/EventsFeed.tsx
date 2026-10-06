"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, MapPin, Plus, Loader2, Clock, Upload, ArrowRight, 
  Ticket, Trash2, User, Share2, Printer, CheckCircle2, QrCode, Building2, Palette, CloudRain, ShoppingBag, CreditCard
} from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })
const MapViewer = dynamic(() => import('./MapViewer'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-zinc-100 animate-pulse rounded-xl" /> 
})

type EventsFeedProps = {
    user: any;
    onShare: (event: any) => void;
    deepLink?: string | null;
}

export default function EventsFeed({ user, onShare, deepLink }: EventsFeedProps) {  
  const [events, setEvents] = useState<any[]>([])
  
  // Dialog & Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [checkoutEvent, setCheckoutEvent] = useState<any>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [isBadgeManagerOpen, setIsBadgeManagerOpen] = useState(false)
  
  // NEW: Attendee Badge Personalization State
  const [isAttendeeInfoOpen, setIsAttendeeInfoOpen] = useState(false)
  const [attendeeInfo, setAttendeeInfo] = useState({ name: '', role: '', company: '' })

  // Logic States
  const [uploading, setUploading] = useState(false)
  const [ticketQty, setTicketQty] = useState(1)
  
  // Mock Attendees for Badge Printing (Admin View)
  const [attendees] = useState<any[]>([
      { id: '1', name: 'Alice Walker', role: 'Designer', company: 'Pixar', ticket: 'General' },
      { id: '2', name: 'Bob Smith', role: 'Developer', company: 'Stripe', ticket: 'VIP' },
      { id: '3', name: 'Charlie Brown', role: 'Founder', company: 'Peanuts Inc', ticket: 'Speaker' },
  ])

  // Print Logic
  const componentRef = useRef<HTMLDivElement>(null)
  const handlePrint = () => {
      const printContent = componentRef.current
      if (printContent) {
          const originalContents = document.body.innerHTML
          document.body.innerHTML = printContent.innerHTML
          window.print()
          document.body.innerHTML = originalContents
          window.location.reload()
      }
  }

  useEffect(() => {
      if (deepLink) {
          const fetchLinkedEvent = async () => {
              const { data } = await supabase.from('events').select('*, profiles:organizer_id(id, username, avatar_url)').eq('id', deepLink).single()
              if (data) setSelectedEvent(data)
          }
          fetchLinkedEvent()
      }
  }, [deepLink])

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', 
    address: '', city: '', state: '', country: '', zip_code: '',
    latitude: null as number | null, longitude: null as number | null,
    
    // TIME & DATE
    start_date: '', start_time: '', end_time: '', 
    rain_date: '', rain_start_time: '', rain_end_time: '',
    
    // FILES
    imageFile: null as File | null,       
    lanyardLogoFile: null as File | null, 
    
    // BADGE COLORS
    badge_bg_color: '#000000', 
    card_bg_color: '#ffffff',  
    text_color: '#000000'      
  })

  useEffect(() => {
    fetchEvents()
    const channel = supabase.channel('events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
        .from('events')
        .select('*, profiles:organizer_id(id, username, avatar_url)')
        .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageFile' | 'lanyardLogoFile') => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, [field]: e.target.files![0] }))
    }
  }

  const handleMapSelect = (data: any) => {
      setFormData(prev => ({
          ...prev,
          address: data.address, city: data.city, state: data.state,
          country: data.country, zip_code: data.zip_code,
          latitude: data.lat, longitude: data.lng
      }))
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.imageFile || !formData.start_date) {
        return alert("Please fill in required fields (Title, Event Image, Date)")
    }
    setUploading(true)

    try {
        const eventFileName = `events/${Date.now()}_cover_${formData.imageFile.name.replace(/\s/g, '')}`
        await supabase.storage.from('uploads').upload(eventFileName, formData.imageFile)
        const { data: eventUrlData } = supabase.storage.from('uploads').getPublicUrl(eventFileName)

        let lanyardLogoUrl = null
        if (formData.lanyardLogoFile) {
            const logoFileName = `events/${Date.now()}_logo_${formData.lanyardLogoFile.name.replace(/\s/g, '')}`
            await supabase.storage.from('uploads').upload(logoFileName, formData.lanyardLogoFile)
            const { data: logoUrlData } = supabase.storage.from('uploads').getPublicUrl(logoFileName)
            lanyardLogoUrl = logoUrlData.publicUrl
        }

        const { error } = await supabase.from('events').insert({
            organizer_id: user.id,
            title: formData.title, description: formData.description,
            ticket_price: parseFloat(formData.price) || 0,
            image_url: eventUrlData.publicUrl,
            lanyard_logo_url: lanyardLogoUrl,
            address: formData.address, city: formData.city, state: formData.state, country: formData.country, zip_code: formData.zip_code,
            latitude: formData.latitude, longitude: formData.longitude,
            location: `${formData.city}, ${formData.state}`, 
            start_date: formData.start_date, start_time: formData.start_time || null, end_time: formData.end_time || null,
            rain_date: formData.rain_date || null, rain_start_time: formData.rain_start_time || null, rain_end_time: formData.rain_end_time || null,
            badge_bg_color: formData.badge_bg_color, card_bg_color: formData.card_bg_color, text_color: formData.text_color
        })

        if (error) throw error

        setIsCreateOpen(false)
        setFormData({
            title: '', description: '', price: '', address: '', city: '', state: '', country: '', zip_code: '',
            latitude: null, longitude: null, start_date: '', start_time: '', end_time: '', rain_date: '', rain_start_time: '', rain_end_time: '',
            imageFile: null, lanyardLogoFile: null, 
            badge_bg_color: '#000000', card_bg_color: '#ffffff', text_color: '#000000'
        })
        fetchEvents()

    } catch (error: any) {
        console.error(error)
        alert(`Failed to create event: ${error.message}`)
    } finally {
        setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure?")) return;
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) {
          setEvents(prev => prev.filter(e => e.id !== id));
          if(selectedEvent?.id === id) setSelectedEvent(null);
      }
  }

  // --- NEW: Handle Ticket Purchase Initiation ---
  const initiateTicketFlow = () => {
      // 1. Open the Personalization Modal
      setIsAttendeeInfoOpen(true)
  }

  // --- NEW: Finalize and Open Payment ---
  const proceedToPayment = () => {
      if (!attendeeInfo.name) return alert("Please enter a name for the badge.")
      
      setIsAttendeeInfoOpen(false) // Close badge modal
      
      // If price > 0, open payment modal
      if (selectedEvent.ticket_price > 0) {
          setCheckoutEvent({ 
              ...selectedEvent, 
              price: selectedEvent.ticket_price * ticketQty, 
              name: `${selectedEvent.title} (${ticketQty} Tix)`,
              // Pass badge info as metadata if needed
              badgeInfo: attendeeInfo 
          })
      } else {
          // Free event logic
          alert("Registered successfully! (Free Event)")
          // Call DB to save ticket...
      }
  }

  return (
    <div className="space-y-6">
        {checkoutEvent && (
            <PaymentModal isOpen={!!checkoutEvent} onClose={() => setCheckoutEvent(null)} plan={checkoutEvent} session={{ user }} />
        )}

        <div className="flex justify-between items-center bg-black p-4 rounded-3xl shadow-sm border border-zinc-100">
            <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                <Calendar className="text-yellow-600 w-5 h-5"/> Upcoming Events
            </h2>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold transition-all shadow-md">
                    <Plus className="w-4 h-4 mr-2"/> Host Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-0">
                {/* ... (Create Event Dialog Content - Same as previous Step) ... */}
                {!isMapOpen ? (
                    <div className="p-8 h-full flex flex-col">
                        <DialogHeader className="mb-6 flex-shrink-0">
                            <DialogTitle className="text-3xl font-bold">Host an Event</DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1">
                            <div className="lg:col-span-7 space-y-6">
                                <div className="p-6 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50 text-center relative hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center h-48 group cursor-pointer">
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageFile')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    {formData.imageFile ? (
                                        <div className="relative z-0">
                                            <CheckCircle2 className="w-10 h-10 text-green-500 mb-2 mx-auto shadow-sm bg-white rounded-full"/>
                                            <span className="text-sm font-bold text-zinc-900">{formData.imageFile.name}</span>
                                            <p className="text-xs text-zinc-400 mt-1">Click to change</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-zinc-600">
                                            <div className="bg-white p-3 rounded-full shadow-sm">
                                                <Upload className="w-6 h-6"/>
                                            </div>
                                            <span className="text-sm font-medium">Upload Event Cover Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Event Title</label>
                                        <Input name="title" placeholder="e.g. Summer Tech Summit" value={formData.title} onChange={handleInputChange} className="font-bold text-lg bg-zinc-50 border-zinc-200 h-12 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Description</label>
                                        <Textarea name="description" placeholder="What's this event about?" value={formData.description} onChange={handleInputChange} className="h-28 resize-none bg-zinc-50 border-zinc-200 rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Ticket Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-zinc-500 font-bold">$</span>
                                            <Input name="price" type="number" placeholder="0.00" value={formData.price} onChange={handleInputChange} className="pl-7 bg-zinc-50 border-zinc-200 h-12 rounded-xl font-bold"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                                            <Button size="sm" variant="ghost" onClick={() => setIsMapOpen(true)} className="h-6 text-[10px] bg-white border border-zinc-200 shadow-sm"><MapPin className="w-3 h-3 mr-1"/> Pin on Map</Button>
                                        </div>
                                        <Input name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} className="bg-white mb-2" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="bg-white" />
                                            <Input name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="bg-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Event Schedule</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-1"><span className="text-[10px] text-zinc-400 block mb-1">Date</span><Input name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} className="bg-white" /></div>
                                            <div><span className="text-[10px] text-zinc-400 block mb-1">Start Time</span><Input name="start_time" type="time" value={formData.start_time} onChange={handleInputChange} className="bg-white" /></div>
                                            <div><span className="text-[10px] text-zinc-400 block mb-1">End Time</span><Input name="end_time" type="time" value={formData.end_time} onChange={handleInputChange} className="bg-white" /></div>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-zinc-200/50">
                                        <label className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1"><CloudRain className="w-3 h-3"/> Rain Date Plan (Optional)</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-1"><span className="text-[10px] text-zinc-400 block mb-1">Rain Date</span><Input name="rain_date" type="date" value={formData.rain_date} onChange={handleInputChange} className="bg-white" /></div>
                                            <div><span className="text-[10px] text-zinc-400 block mb-1">Start Time</span><Input name="rain_start_time" type="time" value={formData.rain_start_time} onChange={handleInputChange} className="bg-white" /></div>
                                            <div><span className="text-[10px] text-zinc-400 block mb-1">End Time</span><Input name="rain_end_time" type="time" value={formData.rain_end_time} onChange={handleInputChange} className="bg-white" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 flex flex-col">
                                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl h-full flex flex-col sticky top-0">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Palette className="w-5 h-5"/></div>
                                        <div><h3 className="font-bold text-zinc-900">Badge Designer</h3><p className="text-xs text-zinc-500">Customize attendee pass appearance</p></div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Lanyard Logo</label>
                                        <div className="relative group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors h-14 flex items-center justify-center cursor-pointer">
                                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'lanyardLogoFile')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                                                {formData.lanyardLogoFile ? (<><CheckCircle2 className="w-4 h-4 text-green-500"/><span className="truncate max-w-[150px]">{formData.lanyardLogoFile.name}</span></>) : (<><Upload className="w-4 h-4"/><span>Upload Logo (Optional)</span></>)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        {[{ label: "Lanyard", field: 'badge_bg_color' }, { label: "Card", field: 'card_bg_color' }, { label: "Text", field: 'text_color' }].map((item: any) => (
                                            <div key={item.field}>
                                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{item.label}</label>
                                                <div className="flex items-center gap-2 p-1 border border-zinc-200 rounded-lg bg-white">
                                                    <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 ring-1 ring-black/5">
                                                        <input type="color" value={(formData as any)[item.field]} onChange={(e) => setFormData({...formData, [item.field]: e.target.value})} className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 border-0" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 bg-zinc-100/50 rounded-2xl flex items-center justify-center p-6 border border-zinc-200 border-dashed relative min-h-[360px]">
                                        <Badge className="absolute top-3 right-3 bg-white text-zinc-500 hover:bg-white border-zinc-200 shadow-sm pointer-events-none">Preview</Badge>
                                        <div className="w-56 h-[28rem] rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden relative flex flex-col items-center py-6 gap-4 transition-colors duration-300 transform hover:scale-[1.02]" style={{ backgroundColor: formData.badge_bg_color }}>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-900/10 rounded-b-xl backdrop-blur-sm border-x border-b border-white/10 z-20"></div>
                                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner mt-2 shrink-0">
                                                {formData.lanyardLogoFile ? (<img src={URL.createObjectURL(formData.lanyardLogoFile)} className="w-full h-full object-cover rounded-full" />) : (<span className="text-[9px] text-white/70 font-bold uppercase text-center leading-tight">Lanyard<br/>Logo</span>)}
                                            </div>
                                            <div className="w-[85%] rounded-2xl shadow-xl p-4 flex flex-col items-center text-center relative mb-2 flex-1" style={{ backgroundColor: formData.card_bg_color }}>
                                                <div className="w-12 h-12 bg-zinc-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center mb-2 shrink-0"><User className="w-6 h-6 text-zinc-300"/></div>
                                                <div className="w-full flex-1 flex flex-col">
                                                    <p className="font-black text-lg leading-none mb-1 line-clamp-1" style={{ color: formData.text_color }}>Attendee</p>
                                                    <p className="text-[10px] font-bold uppercase opacity-60 mb-3" style={{ color: formData.text_color }}>Company Inc.</p>
                                                    <div className="mt-auto flex flex-col items-center gap-2">
                                                        <div className="bg-white p-1 rounded-lg border border-black/5 inline-block shadow-sm">
                                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formData.title || "TICKET-PREVIEW")}&bgcolor=${formData.card_bg_color.replace('#', '')}&color=000000`} alt="QR Code" className="w-16 h-16 object-contain mix-blend-multiply" />
                                                        </div>
                                                        <div className="text-[8px] font-black uppercase tracking-widest border border-current px-2 py-0.5 rounded-full inline-block" style={{ color: formData.text_color }}>VIP PASS</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleCreate} disabled={uploading} className="w-full mt-8 bg-black hover:bg-zinc-800 font-bold h-14 text-white shadow-xl rounded-2xl text-lg flex-shrink-0">
                            {uploading ? <Loader2 className="animate-spin mr-2"/> : "Publish Event"}
                        </Button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col p-6">
                        <div className="flex justify-between mb-4 items-center">
                            <h3 className="font-bold text-lg">Pin Location</h3>
                            <Button size="sm" variant="ghost" onClick={() => setIsMapOpen(false)}>Back</Button>
                        </div>
                        <div className="h-[500px] rounded-xl overflow-hidden border border-zinc-200">
                            <MapPicker onLocationSelect={(data) => { handleMapSelect(data); setIsMapOpen(false); }} onClose={() => setIsMapOpen(false)} />
                        </div>
                    </div>
                )}
            </DialogContent>
            </Dialog>
        </div>

        {/* --- EVENTS LIST --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            const isOwner = user?.id === event.organizer_id
            return (
                <Card key={event.id} className="overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white group flex flex-col">
                    <div className="relative h-60 w-full overflow-hidden">
                        <img src={event.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 text-center min-w-[60px] shadow-sm">
                            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">{event.start_date ? new Date(event.start_date).toLocaleString('default', { month: 'short' }) : 'TBA'}</span>
                            <span className="block text-2xl font-black text-zinc-900 leading-none">{event.start_date ? new Date(event.start_date).getDate() : '--'}</span>
                        </div>
                        <Button size="icon" className="absolute top-16 right-4 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md" onClick={(e) => { e.stopPropagation(); onShare(event) }}>
                            <Share2 className="w-4 h-4"/>
                        </Button>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-xl text-zinc-900 mb-1 line-clamp-1 leading-tight">{event.title}</h3>
                        <div className="mt-auto pt-4 border-t border-zinc-50">
                            {isOwner ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 rounded-xl border-zinc-200 h-10 text-sm" onClick={() => { setSelectedEvent(event); setIsBadgeManagerOpen(true); }}>
                                        <Printer className="w-4 h-4 mr-2"/> Badges
                                    </Button>
                                    <Button variant="destructive" size="icon" className="rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 h-10 w-10" onClick={() => handleDelete(event.id)}>
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ) :(
                                <div className="flex flex-col gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold h-10 justify-center"
                                        onClick={() => alert("No Data Found")}
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2"/> Marketplace
                                    </Button>
                                    <Button 
                                        onClick={() => { setSelectedEvent(event); setTicketQty(1); }} 
                                        className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-10 shadow-sm justify-center"
                                    >
                                        <Ticket className="w-4 h-4 mr-2"/> Get Tickets
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )
          })}
        </div>

        {/* --- EVENT DETAIL MODAL (Step 1) --- */}
        <Dialog open={!!selectedEvent && !isBadgeManagerOpen && !isAttendeeInfoOpen} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            <DialogContent className="max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden bg-white rounded-3xl border-none h-[90vh] flex flex-col md:flex-row">
                {selectedEvent && (() => {
                    const isOwner = user?.id === selectedEvent.organizer_id
                    return (
                        <>
                            <div className="w-full md:w-5/12 bg-zinc-900 flex flex-col relative h-48 md:h-full">
                                <div className="h-full md:h-1/2 relative overflow-hidden group">
                                    <img src={selectedEvent.image_url} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent flex items-end p-8">
                                        <div>
                                            <Badge className="bg-orange-500 border-none mb-3 px-3 py-1 text-xs">{selectedEvent.ticket_price > 0 ? `$${selectedEvent.ticket_price}` : 'Free Entry'}</Badge>
                                            <h2 className="font-bold text-3xl text-white leading-tight shadow-sm">{selectedEvent.title}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block h-1/2 relative border-t border-white/10 bg-zinc-800">
                                    {selectedEvent.latitude ? (
                                        <MapViewer lat={selectedEvent.latitude} lng={selectedEvent.longitude} />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-zinc-500 flex-col"><MapPin className="w-12 h-12 mb-2 opacity-20"/><span className="text-sm font-medium">Map View Unavailable</span></div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full md:w-7/12 flex flex-col bg-white h-full">
                                <div className="flex-1 p-8 md:p-10 overflow-y-auto">
                                    <div className="flex items-center gap-4 mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-white">
                                            <AvatarImage src={selectedEvent.profiles?.avatar_url}/>
                                            <AvatarFallback className="bg-zinc-200 font-bold text-zinc-500">{selectedEvent.profiles?.username?.[0] || <User className="w-6 h-6"/>}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-base font-bold text-zinc-900">{isOwner ? "You (Organizer)" : selectedEvent.profiles?.username}</p>
                                            <p className="text-xs text-zinc-400 font-medium">Verified Host</p>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-xl mb-3 text-zinc-900">About Event</h3>
                                    <p className="text-zinc-500 leading-relaxed text-sm whitespace-pre-wrap mb-6">{selectedEvent.description || "No description provided."}</p>
                                </div>
                                <div className="p-8 bg-white border-t border-zinc-100 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] z-10">
                                    {isOwner ? (
                                        <div className="flex gap-4">
                                            <Button variant="outline" className="flex-1 h-14 rounded-2xl text-base font-bold border-zinc-200 hover:bg-zinc-50" onClick={() => setIsBadgeManagerOpen(true)}><Printer className="w-5 h-5 mr-2"/> Print Badges</Button>
                                            <Button variant="destructive" className="flex-1 h-14 rounded-2xl text-base font-bold" onClick={() => handleDelete(selectedEvent.id)}><Trash2 className="w-5 h-5 mr-2"/> Cancel Event</Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full h-16 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-xl shadow-xl shadow-zinc-200 transition-transform active:scale-[0.98]" onClick={initiateTicketFlow}>
                                            Proceed to Personalize <ArrowRight className="w-6 h-6 ml-2 opacity-50"/>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )
                })()}
            </DialogContent>
        </Dialog>

        {/* --- NEW: ATTENDEE INFO DIALOG (Step 2) --- */}
        <Dialog open={isAttendeeInfoOpen} onOpenChange={setIsAttendeeInfoOpen}>
            <DialogContent className="sm:max-w-4xl w-full h-[80vh] overflow-hidden bg-white rounded-3xl p-0 flex flex-col md:flex-row">
                {/* LEFT: FORM */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between h-full bg-white">
                    <div>
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-3xl font-bold">Badge Details</DialogTitle>
                            <DialogDescription>Enter details to be printed on your entry badge.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Full Name</label>
                                <Input 
                                    placeholder="e.g. John Doe" 
                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                    value={attendeeInfo.name} 
                                    onChange={e => setAttendeeInfo({...attendeeInfo, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Job Title / Role</label>
                                <Input 
                                    placeholder="e.g. Developer" 
                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                    value={attendeeInfo.role} 
                                    onChange={e => setAttendeeInfo({...attendeeInfo, role: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Company</label>
                                <Input 
                                    placeholder="e.g. Acme Corp" 
                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                    value={attendeeInfo.company} 
                                    onChange={e => setAttendeeInfo({...attendeeInfo, company: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-zinc-500 font-medium">Total ({ticketQty} Ticket)</span>
                            <span className="text-xl font-bold">${(selectedEvent?.ticket_price || 0).toFixed(2)}</span>
                        </div>
                        <Button 
                            className="w-full h-14 rounded-xl bg-black text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
                            onClick={proceedToPayment}
                        >
                            {selectedEvent?.ticket_price > 0 ? "Continue to Payment" : "Confirm Registration"}
                            {selectedEvent?.ticket_price > 0 && <CreditCard className="w-5 h-5 ml-2 opacity-70"/>}
                        </Button>
                    </div>
                </div>

                {/* RIGHT: LIVE PREVIEW */}
                <div className="w-full md:w-1/2 bg-zinc-100 p-8 flex items-center justify-center border-l border-zinc-200 relative">
                    <Badge className="absolute top-4 right-4 bg-white text-zinc-500 border-zinc-200">Your Badge Preview</Badge>
                    
                    {/* PREVIEW COMPONENT REUSED */}
                    <div 
                        className="w-64 h-[30rem] rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative flex flex-col items-center py-8 gap-5 transition-all duration-300 transform scale-95"
                        style={{ backgroundColor: selectedEvent?.badge_bg_color || '#000' }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900/10 rounded-b-2xl backdrop-blur-sm border-x border-b border-white/10 z-20"></div>
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner mt-4 shrink-0">
                            {selectedEvent?.lanyard_logo_url || selectedEvent?.image_url ? (
                                <img src={selectedEvent.lanyard_logo_url || selectedEvent.image_url} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <span className="text-[9px] text-white/70 font-bold uppercase">Logo</span>
                            )}
                        </div>
                        <div 
                            className="w-[85%] rounded-3xl shadow-xl p-5 flex flex-col items-center text-center relative mb-4 flex-1 bg-white"
                            style={{ backgroundColor: selectedEvent?.card_bg_color || '#fff' }}
                        >
                            <div className="w-16 h-16 bg-zinc-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-3">
                                <User className="w-8 h-8 text-zinc-300"/>
                            </div>
                            <div className="w-full flex-1 flex flex-col">
                                <p className="font-black text-xl leading-none mb-1 line-clamp-1" style={{ color: selectedEvent?.text_color || '#000' }}>
                                    {attendeeInfo.name || "Your Name"}
                                </p>
                                <p className="text-[10px] font-bold uppercase opacity-60 mb-4 line-clamp-1" style={{ color: selectedEvent?.text_color || '#000' }}>
                                    {attendeeInfo.company || "Company Inc."}
                                </p>
                                <div className="mt-auto flex flex-col items-center gap-3">
                                    <div className="bg-white p-1.5 rounded-xl border border-black/5 inline-block shadow-sm">
                                        <QrCode className="w-16 h-16 text-zinc-900"/>
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-widest border border-current px-3 py-1 rounded-full inline-block" style={{ color: selectedEvent?.text_color || '#000' }}>
                                        ADMIT ONE
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* --- BADGE MANAGER MODAL (Admin Print View) --- */}
        <Dialog open={isBadgeManagerOpen} onOpenChange={setIsBadgeManagerOpen}>
            <DialogContent className="sm:max-w-6xl w-full h-[90vh] bg-zinc-100 flex flex-col p-0 overflow-hidden">
                <DialogHeader className="bg-white p-6 border-b border-zinc-200 flex flex-row items-center justify-between sticky top-0 z-10">
                    <div>
                        <DialogTitle className="text-2xl font-bold text-zinc-900">Attendee Badges</DialogTitle>
                        <DialogDescription>Printable badges for {selectedEvent?.title}.</DialogDescription>
                    </div>
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <Printer className="w-4 h-4 mr-2"/> Print All
                    </Button>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-8">
                    <div ref={componentRef} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 print:grid-cols-2 print:gap-4">
                        {attendees.map((attendee) => {
                            const badgeBg = selectedEvent?.badge_bg_color || '#000'
                            const cardBg = selectedEvent?.card_bg_color || '#fff'
                            const textColor = selectedEvent?.text_color || '#000'

                            return (
                                <div 
                                    key={attendee.id} 
                                    className="break-inside-avoid page-break rounded-3xl overflow-hidden shadow-md flex flex-col items-center py-8 gap-6 relative print:border print:border-black/20"
                                    style={{ backgroundColor: badgeBg }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/20 rounded-b-xl border border-white/10 z-20 backdrop-blur-sm"></div>
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                        {selectedEvent?.lanyard_logo_url || selectedEvent?.image_url ? (
                                            <img src={selectedEvent.lanyard_logo_url || selectedEvent.image_url} className="w-full h-full object-cover rounded-full opacity-90"/>
                                        ) : (
                                            <span className="text-[10px] text-white font-bold">Event Logo</span>
                                        )}
                                    </div>
                                    <div 
                                        className="w-[85%] rounded-2xl shadow-xl p-5 flex flex-col items-center text-center relative"
                                        style={{ backgroundColor: cardBg, color: textColor }}
                                    >
                                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg -mt-12 mb-3 bg-zinc-100 overflow-hidden">
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-200">
                                                <User className="w-10 h-10 text-zinc-400"/>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black mb-1 leading-none">{attendee.name}</h3>
                                        <p className="text-sm opacity-70 font-medium mb-4 uppercase tracking-wide">{attendee.role}</p>
                                        <div className="w-full h-px bg-current opacity-10 mb-4"></div>
                                        <div className="flex items-center justify-center gap-4 w-full mb-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 opacity-30"/>
                                                </div>
                                                <span className="text-[8px] font-bold uppercase opacity-50">{attendee.company}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                 <div className="bg-black p-1 rounded-lg">
                                                    <QrCode className="w-10 h-10 text-white"/>
                                                 </div>
                                                 <span className="text-[8px] font-bold uppercase opacity-50">Scan Me</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="text-xs font-black uppercase tracking-widest border-2 border-current px-3 py-1 rounded-full inline-block opacity-80"
                                            style={{ borderColor: textColor, color: textColor }}
                                        >
                                            {attendee.ticket} TICKET
                                        </div>
                                    </div>
                                    <div className="mt-auto opacity-50 text-[10px] font-mono text-white uppercase tracking-widest">
                                        {selectedEvent?.title?.slice(0, 20)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}