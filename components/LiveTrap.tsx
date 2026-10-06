import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, Lock, Radio, ShieldCheck, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export default function LiveTrap() {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      {/* --- THE 'FAKE' STUDIO UI --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Preview Window */}
         <Card className="md:col-span-2 aspect-video bg-zinc-900 rounded-3xl flex flex-col items-center justify-center text-zinc-500 border-none relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20"></div>
            <div className="z-10 bg-zinc-800/50 p-4 rounded-full backdrop-blur-md mb-4">
                <Radio className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
            <p className="z-10 font-medium">Camera Offline</p>
         </Card>

         

        
         <Card className="p-6 rounded-3xl border-none shadow-sm space-y-6">
            <div>
                <h3 className="font-bold text-xl mb-1">Go Live</h3>
                <p className="text-zinc-500 text-sm">Broadcast to your followers in 1080p.</p>
            </div>
            
            <div className="space-y-3">
                <div className="h-10 bg-zinc-100 rounded-xl w-full"></div>
                <div className="h-10 bg-zinc-100 rounded-xl w-full"></div>
            </div>

            <Button 
                onClick={() => setShowPaywall(true)} 
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-200"
            >
                Start Stream
            </Button>
         </Card>
      </div>

      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative">
                <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="h-6 w-6"/></button>
                <div className="mx-auto bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                    <BadgeCheck className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Verification Required</h2>
                <p className="text-blue-100 mt-2 text-sm">Live streaming is exclusive to Verified Creators.</p>
            </div>
            
            <div className="p-8 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                        <h4 className="font-bold text-zinc-900">Get Verified Badge</h4>
                        <p className="text-xs text-zinc-500">Unlock Live, Analytics & Blue Tick</p>
                    </div>
                    <div className="font-bold text-lg">$9.99</div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
                    Upgrade Now
                </Button>
                <p className="text-center text-xs text-zinc-400">Cancel anytime. Terms apply.</p>
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}