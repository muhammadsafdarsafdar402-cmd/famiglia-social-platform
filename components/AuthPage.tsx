"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Eye, EyeOff, Crown } from 'lucide-react'
import StatusDialog from '@/components/StatusDialog'

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({})
  const [modal, setModal] = useState<{ open: boolean; type: "success" | "error" | "loading"; title: string; message: string }>({
    open: false, type: 'loading', title: '', message: ''
  })

  // --- VALIDATION & AUTH HANDLER (Kept same logic) ---
  const validate = (type: 'login' | 'signup') => {
    let isValid = true; let newErrors: any = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { newErrors.email = "Invalid email address."; isValid = false }
    if (!password || password.length < 6) { newErrors.password = "Min 6 characters."; isValid = false }
    if (type === 'signup' && (!username || username.length < 3)) { newErrors.username = "Min 3 characters."; isValid = false }
    setErrors(newErrors); return isValid
  }

  const handleAuth = async (type: 'login' | 'signup') => {
    if (!validate(type)) return
    setModal({ open: true, type: 'loading', title: type === 'login' ? 'Signing In...' : 'Creating Account...', message: 'Please wait...' })
    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() })
        if (error) throw error
        setModal({ open: true, type: 'success', title: 'Welcome Back!', message: 'You are now logged in.' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { username, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` } }
        })
        if (error) throw error
        if (data.user) {
            await supabase.from('profiles').insert({ id: data.user.id, username, bio: 'New member', verified_tier: 'free_trial', avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` })
            setModal({ open: true, type: 'success', title: 'Account Created!', message: 'Welcome to Famiglia Oro.' })
            setTimeout(() => window.location.reload(), 1500)
        }
      }
    } catch (err: any) {
      setModal({ open: true, type: 'error', title: 'Authentication Failed', message: err.message || 'Error occurred.' })
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">
      
      {/* LEFT: PHONE THEME IMAGE SECTION */}
      <div className="relative hidden lg:block overflow-hidden">
         {/* 1. BACKGROUND IMAGE - Replace src with your girl image path */}
         <img 
            src="/profile_view_image.png" // <--- PUT YOUR IMAGE PATH HERE
            alt="Famiglia Theme" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
         />
         
         {/* 2. GRADIENT OVERLAY (For Text Readability) */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

         {/* 3. BRANDING CONTENT (Bottom Left) */}
         <div className="absolute bottom-0 left-0 p-12 z-10 text-white w-full">
             <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 backdrop-blur-md mb-4">
                    <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest">Premium Suite</span>
                </div>
                <h1 className="text-5xl font-black leading-tight font-serif tracking-tight">
                    Famiglia <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Oro</span>
                </h1>
                <p className="mt-4 text-zinc-300 text-lg max-w-md font-light leading-relaxed">
                    The exclusive digital ecosystem for creators, influencers, and modern businesses.
                </p>
             </div>
             
             {/* Stats Row */}
             <div className="flex gap-8 border-t border-white/10 pt-6">
                <div><div className="text-2xl font-bold text-white">10k+</div><div className="text-xs text-zinc-400 uppercase tracking-wider">Creators</div></div>
                <div><div className="text-2xl font-bold text-white">2.5M</div><div className="text-xs text-zinc-400 uppercase tracking-wider">Reach</div></div>
             </div>
         </div>
      </div>

      {/* RIGHT: LOGIN FORM (Clean & Modern) */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-zinc-50 lg:bg-white rounded-t-[40px] lg:rounded-none mt-20 lg:mt-0 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.2)] lg:shadow-none">
        <div className="w-full max-w-[400px] space-y-8">
            
            {/* Header (Visible on Mobile) */}
            <div className="text-center lg:text-left">
                <div className="lg:hidden w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-yellow-500/20">
                    <Crown className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Welcome Back</h2>
                <p className="text-zinc-500 mt-2 text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-100/80 p-1.5 rounded-2xl">
                    <TabsTrigger value="login" className="rounded-xl font-bold text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-xl font-bold text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-4">
                         <div className="space-y-1.5">
                             <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Email Address</label>
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-14 rounded-2xl px-4 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:border-transparent transition-all ${errors.email ? 'border-red-500 bg-red-50' : ''}`} 
                                placeholder="hello@example.com" 
                                value={email} onChange={(e) => setEmail(e.target.value)} 
                             />
                             {errors.email && <p className="text-red-500 text-xs flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                         </div>
                         
                         <div className="space-y-1.5">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
                                <button className="text-xs font-bold text-yellow-600 hover:text-yellow-700">Forgot?</button>
                             </div>
                             <div className="relative">
                                <Input 
                                    className={`bg-zinc-50 border-zinc-200 h-14 rounded-2xl px-4 pr-12 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:border-transparent transition-all ${errors.password ? 'border-red-500 bg-red-50' : ''}`} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password} onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                             </div>
                             {errors.password && <p className="text-red-500 text-xs flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.password}</p>}
                         </div>
                    </div>
                    
                    <Button 
                        className="w-full h-14 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                        onClick={() => handleAuth('login')}
                    >
                        Sign In
                    </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                             <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Username</label>
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-14 rounded-2xl px-4 focus-visible:ring-2 focus-visible:ring-yellow-400 ${errors.username ? 'border-red-500' : ''}`} 
                                placeholder="@username" 
                                value={username} onChange={(e) => setUsername(e.target.value)} 
                             />
                             {errors.username && <p className="text-red-500 text-xs flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.username}</p>}
                        </div>

                        <div className="space-y-1.5">
                             <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Email</label>
                             <Input 
                                className={`bg-zinc-50 border-zinc-200 h-14 rounded-2xl px-4 focus-visible:ring-2 focus-visible:ring-yellow-400 ${errors.email ? 'border-red-500' : ''}`} 
                                placeholder="hello@example.com" 
                                value={email} onChange={(e) => setEmail(e.target.value)} 
                             />
                             {errors.email && <p className="text-red-500 text-xs flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                        </div>
                         
                        <div className="space-y-1.5">
                             <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Password</label>
                             <div className="relative">
                                <Input 
                                    className={`bg-zinc-50 border-zinc-200 h-14 rounded-2xl px-4 pr-12 focus-visible:ring-2 focus-visible:ring-yellow-400 ${errors.password ? 'border-red-500' : ''}`} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password} onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 focus:outline-none">
                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                             </div>
                             {errors.password && <p className="text-red-500 text-xs flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.password}</p>}
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-bold text-lg shadow-xl shadow-yellow-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                        onClick={() => handleAuth('signup')}
                    >
                        Create Account
                    </Button>
                </TabsContent>
            </Tabs>

            <div className="mt-8 text-center">
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    By continuing, you agree to Famiglia Oro's <a href="#" className="underline hover:text-zinc-900">Terms of Service</a> and <a href="#" className="underline hover:text-zinc-900">Privacy Policy</a>.
                </p>
            </div>
        </div>
      </div>

      <StatusDialog isOpen={modal.open} type={modal.type} title={modal.title} message={modal.message} onClose={() => setModal(prev => ({ ...prev, open: false }))} />
    </div>
  )
}