// "use client"

// import { useState, useEffect } from 'react'
// import { Button } from "@/components/ui/button"
// import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react"

// // export type TourStep = {
// //     targetId: string;
// //     title: string;
// //     content: string;
// //     position?: 'right' | 'left' | 'bottom' | 'top';
// // }

// export default function FeatureTour({ steps, isOpen, onClose }: { steps: TourStep[], isOpen: boolean, onClose: () => void }) {
//     const [currentStepIndex, setCurrentStepIndex] = useState(0)
//     const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
//     const [isMounted, setIsMounted] = useState(false)

//     useEffect(() => { setIsMounted(true) }, [])

//     // Calculate position whenever step or window changes
//     useEffect(() => {
//         if (!isOpen) return

//         const updatePosition = () => {
//             const step = steps[currentStepIndex]
//             const element = document.getElementById(step.targetId)
            
//             // Check if element exists AND is visible (has width)
//             if (element && element.getBoundingClientRect().width > 0) {
//                 element.scrollIntoView({ behavior: 'smooth', block: 'center' })
//                 const rect = element.getBoundingClientRect()
//                 setTargetRect(rect)
//             } else {
//                 // FALLBACK: If element is hidden (e.g. sidebar on mobile), set rect to null
//                 // This triggers the "Centered Fallback" view below
//                 console.log(`Tour target "${step.targetId}" not visible. Switching to fallback view.`)
//                 setTargetRect(null)
//             }
//         }

//         // Slight delay to ensure DOM is ready
//         const timer = setTimeout(updatePosition, 100)
//         window.addEventListener('resize', updatePosition)
//         window.addEventListener('scroll', updatePosition)
        
//         return () => {
//             clearTimeout(timer)
//             window.removeEventListener('resize', updatePosition)
//             window.removeEventListener('scroll', updatePosition)
//         }
//     }, [currentStepIndex, isOpen, steps])

//     if (!isOpen || !isMounted) return null

//     const step = steps[currentStepIndex]
//     const isLastStep = currentStepIndex === steps.length - 1

//     const handleNext = () => {
//         if (isLastStep) {
//             onClose()
//             setCurrentStepIndex(0) // Reset for next time
//         } else {
//             setCurrentStepIndex(prev => prev + 1)
//         }
//     }

//     const handlePrev = () => {
//         if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1)
//     }

//     // --- RENDER ---

//     // SCENARIO 1: Target Found (Show Spotlight)
//     if (targetRect) {
//         let tooltipStyle: React.CSSProperties = {}
        
//         // Calculate Tooltip Position based on preference
//         if (step.position === 'right') {
//             tooltipStyle = { top: targetRect.top, left: targetRect.right + 24 }
//         } else if (step.position === 'left') {
//             tooltipStyle = { top: targetRect.top, right: window.innerWidth - targetRect.left + 24 }
//         } else if (step.position === 'bottom') {
//             tooltipStyle = { top: targetRect.bottom + 24, left: targetRect.left }
//         } else { // Top
//             tooltipStyle = { bottom: window.innerHeight - targetRect.top + 24, left: targetRect.left }
//         }

//         // Prevent off-screen overflow
//         const isMobile = window.innerWidth < 768
//         if (isMobile) {
//             tooltipStyle = { bottom: 20, left: 20, right: 20 } // Fixed bottom on mobile
//         }

//         return (
//             <div className="fixed inset-0 z-[9999] overflow-hidden">
//                 {/* 1. THE SPOTLIGHT (Shadow Overlay) */}
//                 <div 
//                     className="absolute transition-all duration-500 ease-in-out rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] pointer-events-none border-2 border-yellow-400"
//                     style={{
//                         top: targetRect.top - 8, 
//                         left: targetRect.left - 8,
//                         width: targetRect.width + 16,
//                         height: targetRect.height + 16,
//                     }}
//                 />

//                 {/* 2. THE INFO CARD */}
//                 <div 
//                     className="absolute bg-white p-6 rounded-2xl shadow-2xl w-80 max-w-[90vw] animate-in zoom-in-95 duration-300 border border-zinc-200"
//                     style={tooltipStyle}
//                 >
//                     <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900"><X className="w-4 h-4" /></button>
//                     <div className="mb-6">
//                         <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-2 py-1 rounded-full">Step {currentStepIndex + 1} / {steps.length}</span>
//                         <h3 className="text-xl font-bold text-zinc-900 mt-3 mb-2">{step.title}</h3>
//                         <p className="text-sm text-zinc-500 leading-relaxed">{step.content}</p>
//                     </div>
//                     <div className="flex items-center justify-between">
//                         <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentStepIndex === 0} className="text-zinc-400"><ChevronLeft className="w-4 h-4 mr-1"/> Back</Button>
//                         <Button size="sm" onClick={handleNext} className="bg-zinc-900 hover:bg-black text-white rounded-lg px-6">{isLastStep ? "Finish" : "Next"} <ChevronRight className="w-4 h-4 ml-1"/></Button>
//                     </div>
//                 </div>
//             </div>
//         )
//     }

//     // SCENARIO 2: Target NOT Found (Show Centered Modal Fallback)
//     return (
//         <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
//             <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95">
//                 <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
//                 <div className="flex justify-center mb-6">
//                     <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
//                         <HelpCircle className="w-8 h-8 text-yellow-600" />
//                     </div>
//                 </div>
//                 <div className="text-center mb-8">
//                     <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Guide: Step {currentStepIndex + 1} / {steps.length}</span>
//                     <h3 className="text-2xl font-bold text-zinc-900 mt-2 mb-3">{step.title}</h3>
//                     <p className="text-zinc-500 leading-relaxed">{step.content}</p>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button variant="outline" className="flex-1 h-12" onClick={handlePrev} disabled={currentStepIndex === 0}>Back</Button>
//                     <Button className="flex-1 h-12 bg-zinc-900 hover:bg-black text-white" onClick={handleNext}>{isLastStep ? "Finish Tour" : "Next Step"}</Button>
//                 </div>
//             </div>
//         </div>
//     )
// }