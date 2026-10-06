"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { X, ChevronRight, ChevronLeft } from "lucide-react"

export type TourStep = {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function WebsiteTour({ steps, isOpen, onClose }: { steps: TourStep[], isOpen: boolean, onClose: () => void }) {
    const [index, setIndex] = useState(0)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    
    const requestRef = useRef<number | null>(null)

    useEffect(() => { setIsMounted(true) }, [])

    // --- 1. MEASURE POSITION ---
    const updatePosition = () => {
        const step = steps[index]
        const element = document.getElementById(step.targetId)
        
        if (element) {
            const newRect = element.getBoundingClientRect()
            
            // Only update state if position changed significantly (prevents jitter)
            setRect(prev => {
                if (!prev) return newRect
                if (Math.abs(prev.top - newRect.top) < 1 && 
                    Math.abs(prev.left - newRect.left) < 1 &&
                    Math.abs(prev.width - newRect.width) < 1) return prev
                return newRect
            })
        } else {
            setRect(null)
        }
    }

    // --- 2. SCROLL & TRACKING HANDLER ---
    useEffect(() => {
        if (!isOpen) return

        const step = steps[index]
        const element = document.getElementById(step.targetId)
        
        // SMART SCROLL LOGIC:
        if (element) {
            const r = element.getBoundingClientRect()
            const isInViewport = 
                r.top >= 0 &&
                r.left >= 0 &&
                r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                r.right <= (window.innerWidth || document.documentElement.clientWidth)

            // Only scroll if the element is NOT fully visible
            // And use 'nearest' to avoid jumping the page for large sticky sidebars
            if (!isInViewport) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
        }

        // Start the loop to track the element position
        const loop = () => {
            updatePosition()
            requestRef.current = requestAnimationFrame(loop)
        }
        loop()

        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current)
        }
    }, [index, isOpen, steps])

    if (!isMounted || !isOpen) return null

    const step = steps[index]
    const isLast = index === steps.length - 1

    const next = () => {
        if (isLast) {
            onClose()
            setIndex(0)
        } else {
            setIndex(i => i + 1)
        }
    }

    const prev = () => {
        if (index > 0) setIndex(i => i - 1)
    }

    // --- CALCULATE TOOLTIP POSITION ---
    let tooltipStyle: React.CSSProperties = { 
        position: 'fixed',
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 10002
    } 
    
    if (rect) {
        const padding = 15
        const boxWidth = 320
        const boxHeight = 200 
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight

        let pos = step.position || 'bottom'

        // 1. Flip Logic
        if (pos === 'bottom' && rect.bottom + boxHeight > viewportH) pos = 'top'
        if (pos === 'top' && rect.top - boxHeight < 0) pos = 'bottom'
        if (pos === 'right' && rect.right + boxWidth > viewportW) pos = 'left'
        if (pos === 'left' && rect.left - boxWidth < 0) pos = 'right'

        // 2. Assign Coordinates
        tooltipStyle = { position: 'fixed', zIndex: 10002 } 

        if (pos === 'right') {
            tooltipStyle.top = rect.top
            tooltipStyle.left = rect.right + padding
        } else if (pos === 'left') {
            tooltipStyle.top = rect.top
            tooltipStyle.left = rect.left - boxWidth - padding
        } else if (pos === 'top') {
            tooltipStyle.top = rect.top - boxHeight - padding
            tooltipStyle.left = rect.left
        } else { // bottom
            tooltipStyle.top = rect.bottom + padding
            tooltipStyle.left = rect.left
        }

        // 3. Horizontal Safety
        if (Number(tooltipStyle.left) + boxWidth > viewportW) {
            tooltipStyle.left = viewportW - boxWidth - 20
        }
        if (Number(tooltipStyle.left) < 20) {
            tooltipStyle.left = 20
        }
    }

    return (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
            
            {/* 1. DARK OVERLAY (SPOTLIGHT) */}
            {rect ? (
                <div 
                    className="absolute transition-all duration-75 ease-out rounded-lg border-2 border-yellow-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                    style={{
                        top: rect.top - 4,
                        left: rect.left - 4,
                        width: rect.width + 8,
                        height: rect.height + 8,
                        pointerEvents: 'none'
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" />
            )}

            {/* 2. TOOLTIP BOX */}
            <div 
                className="pointer-events-auto bg-white p-6 rounded-xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200 border-l-4 border-yellow-400"
                style={tooltipStyle}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Guide {index + 1} / {steps.length}
                        </span>
                        <h3 className="text-lg font-bold text-zinc-900 mt-1">{step.title}</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 -mr-2 -mt-2 p-2">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
                
                <p className="text-sm text-zinc-600 mb-6 leading-relaxed">{step.description}</p>

                <div className="flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={prev} 
                        disabled={index === 0}
                        className="text-zinc-400 hover:text-zinc-900 px-0 hover:bg-transparent"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1"/> Prev
                    </Button>
                    <div className="flex gap-2">
                        <Button 
                            onClick={onClose} 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-400 text-xs"
                        >
                            Skip
                        </Button>
                        <Button 
                            onClick={next} 
                            size="sm" 
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg"
                        >
                            {isLast ? "Finish" : "Next"} <ChevronRight className="w-3 h-3 ml-1"/>
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    )
}