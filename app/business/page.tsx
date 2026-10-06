"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Search, ArrowRight, Store, CheckCircle2 } from 'lucide-react'

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchBusinesses()
  }, [search])

  const fetchBusinesses = async () => {
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false })
    
    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    const { data } = await query
    if (data) setBusinesses(data)
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900">Business Directory</h1>
                    <p className="text-zinc-500">Discover brands, shops, and services.</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400"/>
                        <Input 
                            placeholder="Search businesses..." 
                            className="pl-9 h-12 rounded-xl bg-white border-zinc-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => router.push('/business/create')} className="h-12 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold px-6">
                        <Store className="w-4 h-4 mr-2"/> Create Page
                    </Button>
                </div>
            </div>

            {/* Business Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((biz) => (
                    <Card 
                        key={biz.id} 
                        onClick={() => router.push(`/business/${biz.id}`)}
                        className="group cursor-pointer overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-xl transition-all bg-white"
                    >
                        {/* Banner Area */}
                        <div className="h-32 bg-zinc-100 relative overflow-hidden">
                            {biz.banner_url ? (
                                <img src={biz.banner_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 opacity-5">
                                    <Building2 className="w-12 h-12"/>
                                </div>
                            )}
                        </div>

                        {/* Info Area */}
                        <div className="px-6 pb-6 relative">
                            {/* Logo (Overlapping) */}
                            <div className="-mt-10 mb-3 flex justify-between items-end">
                                <div className="p-1 bg-white rounded-2xl shadow-sm inline-block">
                                    <Avatar className="w-20 h-20 rounded-xl border border-zinc-100 bg-white">
                                        <AvatarImage src={biz.logo_url} className="object-cover"/>
                                        <AvatarFallback className="font-bold text-xl text-zinc-400">{biz.name[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                                {biz.verified && (
                                    <div className="mb-1 mr-1 bg-blue-50 p-1.5 rounded-full text-blue-500" title="Verified Business">
                                        <CheckCircle2 className="w-5 h-5 fill-current"/>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-xl text-zinc-900 leading-tight mb-1">{biz.name}</h3>
                            <p className="text-sm text-zinc-500 font-medium mb-3">@{biz.handle} • {biz.category}</p>
                            
                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10">
                                {biz.description || "No description provided."}
                            </p>

                            <Button variant="outline" className="w-full rounded-xl border-zinc-200 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                Visit Page <ArrowRight className="w-4 h-4 ml-2 opacity-50"/>
                            </Button>
                        </div>
                    </Card>
                ))}

                {businesses.length === 0 && (
                    <div className="col-span-full py-20 text-center text-zinc-400">
                        <Store className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                        <p>No businesses found. Be the first to create one!</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}