import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, Ticket, MapPin, Calendar, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function EventCard({ event, user }: { event: any, user: any }) {
  const [showScanner, setShowScanner] = useState(false)
  const [showLanyard, setShowLanyard] = useState(false)

  // Scanner Logic
  useEffect(() => {
    if (showScanner) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false)
        scanner.render((decodedText) => {
          alert(`Check-in Successful for ID: ${decodedText}`)
          scanner.clear()
          setShowScanner(false)
        }, () => {})
      }, 100)
    }
  }, [showScanner])

  return (
    <>
      {/* --- THE CARD --- */}
      <div className="group relative overflow-hidden rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300">
        
        {/* Image Section */}
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img src={event.image_url || `https://source.unsplash.com/random/800x600/?event,party&sig=${event.id}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          
          <div className="absolute top-4 right-4 z-20">
             <Badge className="bg-white/90 text-zinc-900 hover:bg-white backdrop-blur-md px-3 py-1 text-xs font-bold shadow-sm">
                ${event.ticket_price}
             </Badge>
          </div>
          
          <div className="absolute bottom-4 left-4 z-20 text-white">
             <h3 className="font-bold text-xl leading-tight mb-1">{event.title}</h3>
             <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
             </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-5 flex items-center justify-between gap-4">
             <Button variant="outline" className="flex-1 rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700" onClick={() => setShowLanyard(true)}>
                <Ticket className="h-4 w-4 mr-2 text-indigo-500" /> View Pass
             </Button>
             <Button className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white" onClick={() => setShowScanner(true)}>
                <QrCode className="h-4 w-4 mr-2" /> Check In
             </Button>
        </div>
      </div>

      {/* --- MODAL 1: LANYARD (DIGITAL PASS) --- */}
      <Dialog open={showLanyard} onOpenChange={setShowLanyard}>
        <DialogContent className="sm:max-w-xs bg-transparent border-none shadow-none p-0">
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
                {/* Lanyard Top Hole */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3 bg-zinc-200 rounded-b-xl z-20"></div>
                
                {/* Header */}
                <div className="bg-indigo-600 p-8 text-center text-white pt-10">
                    <h2 className="font-black text-2xl uppercase tracking-widest leading-none">{event.title}</h2>
                    <p className="text-indigo-200 text-xs mt-2 uppercase tracking-wide">VIP Access Pass</p>
                </div>

                {/* Profile */}
                <div className="px-6 py-8 flex flex-col items-center text-center relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg -mt-20 mb-4 bg-zinc-200">
                        <img src={user?.user_metadata?.avatar_url} className="w-full h-full rounded-full" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">{user?.user_metadata?.username}</h3>
                    <p className="text-zinc-500 text-sm mb-6">{user?.email}</p>
                    
                    {/* Fake Barcode */}
                    <div className="w-full h-12 bg-zinc-100 rounded-lg flex items-center justify-center space-x-1 overflow-hidden opacity-50">
                        {[...Array(40)].map((_, i) => (
                            <div key={i} className={`h-full bg-zinc-900`} style={{ width: Math.random() * 4 + 1 }}></div>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2 font-mono">ID: {user?.id?.slice(0,12)}</p>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: SCANNER --- */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-center mb-4">Scan Attendee QR</DialogTitle></DialogHeader>
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
             <div id="reader" className="w-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}