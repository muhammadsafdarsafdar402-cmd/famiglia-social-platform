"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, Building2, Store } from 'lucide-react'

export default function MyBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchMyBiz = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id)
            if (data) setBusinesses(data)
        }
    }
    fetchMyBiz()
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-zinc-50">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-black text-zinc-900">My Businesses</h1>
                <p className="text-zinc-500">Manage your pages, stores, and events.</p>
            </div>
            <Button onClick={() => router.push('/business/create')} className="bg-black hover:bg-zinc-800 text-white rounded-xl h-12 px-6">
                <Plus className="w-4 h-4 mr-2"/> Create New Page
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3"/>
                    <p className="text-zinc-400">You haven't created any business pages yet.</p>
                </div>
            )}

            {businesses.map(biz => (
                <Card key={biz.id} className="overflow-hidden rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => router.push(`/business/${biz.id}`)}>
                    <div className="h-32 bg-zinc-100 relative">
                        {biz.banner_url ? (
                            <img src={biz.banner_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center opacity-10"><Building2 className="w-8 h-8 text-white"/></div>
                        )}
                        <div className="absolute -bottom-6 left-6">
                            <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
                                {biz.logo_url ? <img src={biz.logo_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-zinc-100"/>}
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 px-6 pb-6">
                        <h3 className="font-bold text-lg text-zinc-900">{biz.name}</h3>
                        <p className="text-xs text-zinc-500 mb-4">@{biz.handle} • {biz.category}</p>
                        <Button variant="outline" className="w-full rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                            Manage Page <ArrowRight className="w-4 h-4 ml-2 opacity-50"/>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    </div>
  )
}