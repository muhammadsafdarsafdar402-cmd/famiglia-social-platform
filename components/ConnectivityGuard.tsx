"use client"

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCcw, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function ConnectivityGuard({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // 1. Check initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    // 2. Define event handlers
    const handleOnline = () => {
      setIsOnline(true)
      setIsReconnecting(true)
      // Optional: Auto-reload to fix broken scripts (like Stripe)
      setTimeout(() => window.location.reload(), 1000) 
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // 3. Add listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 4. Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // If online, render the app normally
  if (isOnline) {
    return <>{children}</>
  }

  // If offline, show the "No Internet" screen
  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      
      {/* Icon Animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-zinc-900 p-6 rounded-full border-2 border-zinc-800">
          <WifiOff className="w-16 h-16 text-zinc-500" />
        </div>
      </div>

      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
        No Internet Connection
      </h1>
      
      <p className="text-zinc-400 max-w-sm mb-8 text-sm leading-relaxed">
        We lost connection to the server. Features like Payment, Login, and Feeds are currently unavailable.
      </p>

      <div className="space-y-4 w-full max-w-xs">
        {/* Manual Reload Button */}
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl"
          disabled={isReconnecting}
        >
          {isReconnecting ? (
            <>
              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Reconnecting...
            </>
          ) : (
            "Try Again"
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Wifi className="w-3 h-3 animate-pulse" />
          <span>Waiting for connection...</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[10px] text-zinc-600 font-serif tracking-widest uppercase">
        Famiglia Oro CS
      </div>
    </div>
  )
}