"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Lock, AlertCircle, X, ShieldCheck } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabase'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ plan, session, onSuccess }: any) {
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setIsLoading(true)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        })

        if (error) {
            setMessage(error.message || "Payment failed.")
            setIsLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Payment Success -> Update DB
            await handleDatabaseUpdate()
        }
    }


const handleDatabaseUpdate = async () => {
    try {
        await supabase
            .from('profiles')
            .update({ verified_tier: plan.tierId })
            .eq('id', session.user.id)

        if (plan.badgeImg) {
            const { data: existing } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('badge_url', plan.badgeImg)
                .single()

            if (!existing) {
                await supabase
                    .from('user_badges')
                    .insert({
                        user_id: session.user.id,
                        badge_url: plan.badgeImg,
                        badge_name: plan.name,
                        tier_id: plan.tierId
                    })
            }
        }
        
        onSuccess() 
    } catch (err: any) {
        console.error(err)
        setMessage("Payment succeeded, but activation failed: " + err.message)
    } finally {
        setIsLoading(false)
    }
}

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm text-zinc-900">{plan.name}</h3>
                    <p className="text-xs text-zinc-500">Secure transaction</p>
                </div>
                <span className="font-bold text-lg">${plan.price}</span>
            </div>
            
            <PaymentElement />
            
            {message && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/> <span>{message}</span>
                </div>
            )}

            <Button disabled={isLoading || !stripe || !elements} className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : `Pay $${plan.price}`}
            </Button>
            
            <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1 pb-2">
                <Lock className="w-3 h-3"/> Encrypted by Stripe
            </p>
        </form>
    )
}

// --- MAIN MODAL COMPONENT ---
export default function PaymentModal({ isOpen, onClose, plan, session }: any) {
    const [clientSecret, setClientSecret] = useState("")
    const [errorMessage, setErrorMessage] = useState("") 
    const [isSuccess, setIsSuccess] = useState(false)
    const [isActivating, setIsActivating] = useState(false)

    // Check if plan is free
    const isFree = plan?.price === "0.00"

    useEffect(() => {
        if (isOpen && plan && session?.user) {
            // Reset State
            setClientSecret("")
            setErrorMessage("")
            setIsSuccess(false)
            setIsActivating(false)

            // 1. IF FREE: STOP HERE (Don't call Stripe)
            if (isFree) return

            // 2. IF PAID: FETCH STRIPE INTENT
            const amountInCents = Math.round(parseFloat(plan.price) * 100)

            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: amountInCents, 
                    description: `Subscription: ${plan.name}`,
                    metadata: { userId: session.user.id, tierId: plan.tierId }
                }),
            })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Server connection failed")
                if (!data.clientSecret) throw new Error("No client secret returned")
                setClientSecret(data.clientSecret)
            })
            .catch((err) => {
                console.error("Payment Init Error:", err)
                setErrorMessage(err.message)
            })
        }
    }, [isOpen, plan, session, isFree])

    // --- HANDLE FREE ACTIVATION ---
    const handleFreeActivation = async () => {
        setIsActivating(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ verified_tier: plan.tierId  ,verified_badge: plan.badgeImg })
                .eq('id', session.user.id)

            if (error) throw error
            
            setIsSuccess(true)
            setTimeout(() => {
                window.location.reload()
            }, 2000)

        } catch (err: any) {
            setErrorMessage(err.message)
        } finally {
            setIsActivating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 rounded-3xl scrollbar-hide">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {isSuccess ? (
                            <span className="text-green-600 flex items-center gap-2"><CheckCircle2/> Success</span>
                        ) : (
                            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> {isFree ? "Activate Trial" : "Secure Checkout"}</span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {errorMessage ? (
                    <div className="py-10 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8"/>
                        </div>
                        <h3 className="font-bold text-lg">Error</h3>
                        <p className="text-sm text-zinc-500 mt-2 mb-6 max-w-[200px] mx-auto">{errorMessage}</p>
                        <Button onClick={onClose} variant="outline" className="rounded-full px-6">Close</Button>
                    </div>
                ) : isSuccess ? (
                    <div className="py-10 text-center animate-in zoom-in-95">
                         <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8"/>
                        </div>
                        <h3 className="font-bold text-lg">You are Verified!</h3>
                        <p className="text-sm text-zinc-500 mt-2">The <strong>{plan?.name}</strong> is now active on your account.</p>
                    </div>
                ) : isFree ? (
                    <div className="space-y-6 pt-4">
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-center">
                            <h3 className="font-bold text-lg text-zinc-900">{plan?.name}</h3>
                            <p className="text-sm text-zinc-500 mt-1">Free for {plan?.duration}</p>
                            <div className="mt-4 text-3xl font-black">$0.00</div>
                            <p className="text-[10px] text-zinc-400 mt-2">No credit card required</p>
                        </div>
                        <Button 
                            onClick={handleFreeActivation} 
                            disabled={isActivating}
                            className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl"
                        >
                            {isActivating ? <Loader2 className="animate-spin w-5 h-5"/> : "Start Free Trial"}
                        </Button>
                    </div>
                ) : clientSecret ? (
                    // --- PAID PLAN UI (STRIPE) ---
                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                        <CheckoutForm 
                            plan={plan} 
                            session={session} 
                            onSuccess={() => {
                                setIsSuccess(true)
                                setTimeout(() => window.location.reload(), 2000)
                            }} 
                        />
                    </Elements>
                ) : (
                    // --- LOADING STATE ---
                    <div className="h-60 flex flex-col items-center justify-center gap-4 text-zinc-400">
                        <Loader2 className="w-10 h-10 animate-spin text-yellow-500"/>
                        <p className="text-xs font-medium">Preparing checkout...</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}