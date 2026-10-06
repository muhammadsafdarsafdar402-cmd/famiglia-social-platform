"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Removed DialogTrigger (we control it manually now)
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingBag, Plus, Search, Loader2, MessageCircle, 
  Play, Video as VideoIcon, Image as ImageIcon, Trash2, 
  ShoppingCart, Check, Minus, X, UploadCloud, CheckCircle,
  Edit, Calendar, Share2, Lock, Store, ShieldCheck // Added Lock, Store, ShieldCheck
} from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'
import SubscriptionPlans from '@/components/SubscriptionPlan' // Import Plans

// --- CONFIG: TIERS ALLOWED TO SELL ---
const TIERS_WITH_SELLER_ACCESS = [
    'free_trial', 'mid_student', 'hs_student', 'college_student',
    'verified_user', 'verified_live', 'content_creator', 'verified_artist',
    'content_upload_badge', 'business_startup', 'suitehub_access',
    'all_no_live', 'ultimate_no_suite', 'full_suite_access'
]

type MallFeedProps = {
    session: any;
    onChat: (seller: any) => void;
    onShare: (item: any) => void;
    globalSearch?: string;
    deepLink?: string | null;
    businessId?: string; 
}

// --- CART DRAWER ---
function CartDrawer({ cart, onUpdateQty, onRemove, onCheckout }: { cart: any[], onUpdateQty: (id: number, delta: number) => void, onRemove: (id: number) => void, onCheckout: () => void }) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return (
        <Sheet> 
            <SheetTrigger asChild>
                <Button variant="outline" className="relative rounded-full border-zinc-200 hover:border-yellow-400 hover:bg-yellow-50">
                    <ShoppingCart className="w-5 h-5 text-zinc-700" />
                    {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[450px] flex flex-col bg-white">
                <SheetHeader className="border-b border-zinc-100 pb-4"><SheetTitle>Your Cart</SheetTitle></SheetHeader>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {cart.length === 0 && <div className="text-center text-zinc-400 mt-20 flex flex-col items-center"><ShoppingBag className="w-12 h-12 opacity-20 mb-2"/>Cart is empty</div>}
                    {cart.map((item) => (
                        <div key={item.cart_id} className="flex gap-4 items-center bg-zinc-50 p-3 rounded-2xl">
                            <img src={item.image_url} className="w-20 h-20 rounded-xl object-cover bg-white shadow-sm" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                                <p className="text-zinc-500 text-xs mb-2">${item.price} each</p>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => onUpdateQty(item.cart_id, -1)} disabled={item.quantity <= 1}><Minus className="w-3 h-3"/></Button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => onUpdateQty(item.cart_id, 1)}><Plus className="w-3 h-3"/></Button>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(item.cart_id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                </div>
                <div className="border-t border-zinc-100 pt-4 space-y-4">
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    <Button onClick={onCheckout} className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg">Checkout Now</Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default function MallFeed({ session, onChat, onShare, globalSearch = '', deepLink, businessId}: MallFeedProps) {  
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [localSearch, setLocalSearch] = useState('')
  
  // --- STATE FOR CREATION & SUBSCRIPTIONS ---
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [canSell, setCanSell] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', imageFile: null as File | null, videoFile: null as File | null })
  const [previews, setPreviews] = useState({ image: '', video: '' })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [checkoutItem, setCheckoutItem] = useState<any>(null)

  // 1. CHECK PERMISSIONS ON LOAD
  useEffect(() => {
      const checkAccess = async () => {
          if (!session?.user) return
          
          const { data } = await supabase
              .from('profiles')
              .select('verified_tier')
              .eq('id', session.user.id)
              .single()

          if (data?.verified_tier && TIERS_WITH_SELLER_ACCESS.includes(data.verified_tier)) {
              setCanSell(true)
          } else {
              setCanSell(false)
          }
      }
      checkAccess()
  }, [session])

  async function fetchCart() {
      if (!session?.user?.id) return;
      
      const { data } = await supabase
          .from('cart_items')
          .select('id, quantity, product:products(*)') 
          .eq('user_id', session.user.id)
      
      if (data) {
          const formattedCart = data.map((item: any) => ({
              ...item.product,      
              cart_id: item.id,     
              quantity: item.quantity
          }))
          setCart(formattedCart)
      }
  }

  // --- DEEP LINK HANDLER ---
  useEffect(() => {
      if (deepLink) {
          const fetchLinkedProduct = async () => {
              const { data } = await supabase.from('products').select('*, profiles(id, username, avatar_url)').eq('id', deepLink).single()
              if (data) {
                  setSelectedProduct(data)
                  setActiveMediaIndex(0)
              }
          }
          fetchLinkedProduct();
          
      }
  }, [deepLink])

  useEffect(() => {
     fetchProducts()
     fetchCart() 
       const channel = supabase.channel('mall_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts()).subscribe(); return () => { supabase.removeChannel(channel) } }, [globalSearch])
  
  async function fetchProducts() { 
      let query = supabase.from('products').select('*, profiles(id, username, avatar_url)').order('created_at', { ascending: false });
  
  if (businessId) {
          query = query.eq('business_id', businessId)
      }
      if(globalSearch) query = query.ilike('name', `%${globalSearch}%`);
      const { data } = await query; 
      if (data) setProducts(data) 
  }

  const activeSearch = (localSearch || globalSearch).toLowerCase(); 
  const filteredProducts = products.filter(p => { 
      const matchName = p.name.toLowerCase().includes(activeSearch); 
      const matchDesc = p.description ? p.description.toLowerCase().includes(activeSearch) : false; 
      return matchName || matchDesc 
  })

  const handleImageSelect = (e: any) => { const file = e.target.files?.[0]; if (file) { setNewProduct({ ...newProduct, imageFile: file }); setPreviews({ ...previews, image: URL.createObjectURL(file) }) } }
  const handleVideoSelect = (e: any) => { const file = e.target.files?.[0]; if (file) { setNewProduct({ ...newProduct, videoFile: file }); setPreviews({ ...previews, video: URL.createObjectURL(file) }) } }
  const clearFile = (type: any) => { if (type === 'image') { setNewProduct({ ...newProduct, imageFile: null }); setPreviews({ ...previews, image: '' }) } else { setNewProduct({ ...newProduct, videoFile: null }); setPreviews({ ...previews, video: '' }) } }
  
  const handleCreate = async () => { 
      if (!newProduct.name || !newProduct.price || !newProduct.imageFile) return alert("Required!"); 
      setUploading(true); 
      try { 
          const imgName = `products/img_${Date.now()}_${newProduct.imageFile.name.replace(/\s/g, '')}`; 
          await supabase.storage.from('uploads').upload(imgName, newProduct.imageFile); 
          const { data: imgData } = supabase.storage.from('uploads').getPublicUrl(imgName); 
          let videoUrl = null; 
          if (newProduct.videoFile) { 
              const vidName = `products/vid_${Date.now()}_${newProduct.videoFile.name.replace(/\s/g, '')}`; 
              await supabase.storage.from('uploads').upload(vidName, newProduct.videoFile); 
              const { data: vidData } = supabase.storage.from('uploads').getPublicUrl(vidName); 
              videoUrl = vidData.publicUrl; 
          } 
          const payload: any = { 
              seller_id: session.user.id, 
              name: newProduct.name, 
              description: newProduct.description, 
              price: parseFloat(newProduct.price), 
              image_url: imgData.publicUrl, 
              video_url: videoUrl 
          }
          if (businessId) payload.business_id = businessId
          const { error: dbError } = await supabase.from('products').insert(payload); 
          if (dbError) throw dbError; 
          setUploading(false); setSuccess(true); 
          setTimeout(() => { setIsCreateOpen(false); setSuccess(false); setNewProduct({ name: '', description: '', price: '', imageFile: null, videoFile: null }); setPreviews({ image: '', video: '' }); fetchProducts() }, 1500) 
      } catch (err: any) { console.error(err); setUploading(false); alert("Error") } 
  }
  
  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure?")) return;
      await supabase.from('products').delete().eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if(selectedProduct?.id === id) setSelectedProduct(null);
  }
  
  const addToCart = async (product: any) => {
      setAddedIds(prev => new Set(prev).add(product.id)); 
      
      const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('user_id', session.user.id).eq('product_id', product.id).single()

      if (existing) {
          await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
      } else {
          await supabase.from('cart_items').insert({ user_id: session.user.id, product_id: product.id, quantity: 1 })
      }

      await fetchCart()
      setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n }), 2000) 
  }
  
  const updateCartQty = async (cartItemId: number, delta: number) => {
      const item = cart.find(c => c.cart_id === cartItemId)
      if(!item) return
      const newQty = Math.max(1, item.quantity + delta)
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', cartItemId)
      fetchCart()
  }  

  const removeFromCart = async (cartItemId: number) => {
      await supabase.from('cart_items').delete().eq('id', cartItemId)
      fetchCart()
  }

  const getMediaList = (product: any) => { const list = [{ type: 'image', url: product.image_url }]; if (product.video_url) list.unshift({ type: 'video', url: product.video_url }); return list }
  
  const handleCartCheckout = () => {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      if (total === 0) return
      const bundledItem = { id: 0, name: `Cart Checkout (${cart.length} items)`, price: total, description: cart.map(i => `${i.quantity}x ${i.name}`).join(', ') }
      setCheckoutItem(bundledItem)
  }

  // --- NEW: HANDLE CLICK ON SELL BUTTON ---
  const handleSellClick = () => {
      if (canSell) {
          setIsCreateOpen(true)
      } else {
          setShowPaywall(true)
      }
  }

  return (
    <div className="space-y-6">
        {checkoutItem && <PaymentModal isOpen={!!checkoutItem} onClose={() => setCheckoutItem(null)} plan={checkoutItem} type="product" session={session} />}

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
            <div className="relative w-full md:w-96"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" /><Input placeholder="Search products..." className="pl-9 bg-zinc-50 border-none rounded-full" value={localSearch} onChange={e => setLocalSearch(e.target.value)}/></div>
            <div className="flex items-center gap-3">
                <CartDrawer cart={cart} onUpdateQty={updateCartQty} onRemove={removeFromCart} onCheckout={handleCartCheckout} />
                
                {/* --- MODIFIED SELL BUTTON --- */}
                <Button 
                    onClick={handleSellClick} 
                    className="rounded-full bg-zinc-900 hover:bg-black text-white"
                >
                    <Plus className="w-4 h-4 mr-2 text-yellow-400"/> 
                    Sell Item 
                    {!canSell && <Lock className="w-3 h-3 ml-2 text-zinc-500" />}
                </Button>

                {/* --- LISTING FORM DIALOG (Only opens if allowed) --- */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        {success ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>
                                <h3 className="text-2xl font-bold">Listed!</h3>
                            </div>
                        ) : (
                            <> 
                                <DialogHeader><DialogTitle>List a Product</DialogTitle></DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="flex gap-4"><div className={`flex-1 aspect-square rounded-xl border-2 ${previews.image ? 'border-solid border-yellow-400' : 'border-dashed border-zinc-200'} bg-zinc-50 relative overflow-hidden group`}>{previews.image ? <><img src={previews.image} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><Button size="icon" variant="destructive" onClick={() => clearFile('image')}><X className="w-4 h-4"/></Button></div></> : <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer"><ImageIcon className="w-8 h-8 text-zinc-300 mb-2"/><span className="text-xs font-bold text-zinc-500">Image</span><input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} /></label>}</div><div className={`flex-1 aspect-square rounded-xl border-2 ${previews.video ? 'border-solid border-yellow-400' : 'border-dashed border-zinc-200'} bg-zinc-50 relative overflow-hidden group`}>{previews.video ? <><div className="w-full h-full bg-black flex items-center justify-center"><VideoIcon className="w-8 h-8 text-white" /></div><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><Button size="icon" variant="destructive" onClick={() => clearFile('video')}><X className="w-4 h-4"/></Button></div></> : <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer"><UploadCloud className="w-8 h-8 text-zinc-300 mb-2"/><span className="text-xs font-bold text-zinc-500">Video</span><input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} /></label>}</div></div>
                                    <Input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="focus-visible:ring-yellow-400"/>
                                    <Textarea placeholder="Description..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="resize-none focus-visible:ring-yellow-400"/>
                                    <div className="relative"><span className="absolute left-3 top-2.5 text-zinc-500 font-bold">$</span><Input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="pl-7 focus-visible:ring-yellow-400"/></div>
                                    <Button onClick={handleCreate} disabled={uploading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12">{uploading ? <Loader2 className="animate-spin"/> : "List Item"}</Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* --- PAYWALL DIALOG (Trap) --- */}
                <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
                    <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none p-0 overflow-hidden">
                        <div className="bg-zinc-900 p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-32 w-32 bg-blue-500/20 rounded-full blur-2xl"></div>
                            <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="h-6 w-6"/></button>
                            
                            <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                                <Store className="h-8 w-8 text-blue-400" />
                            </div>
                            
                            <DialogTitle className="text-2xl font-black">Become a Seller</DialogTitle>
                            <p className="text-zinc-400 mt-2 text-sm">Selling in the Global Mall is exclusive to Verified Users.</p>
                        </div>
                        
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <ShieldCheck className="h-8 w-8 text-blue-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-zinc-900">Activate Free Trial</h4>
                                    <p className="text-xs text-zinc-600">Start selling today for free</p>
                                </div>
                                <div className="font-bold text-lg text-zinc-900">$0.00</div>
                            </div>

                            <Button 
                                onClick={() => { setShowPaywall(false); setShowPlansModal(true); }}
                                className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold"
                            >
                                Get Verified to Sell
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* --- SUBSCRIPTION PLANS MODAL --- */}
                <SubscriptionPlans isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} session={session} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
                const isOwner = product.seller_id === session.user.id
                return (
                    <Card key={product.id} className="group cursor-pointer overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-xl transition-all bg-white" onClick={() => { setSelectedProduct(product); setActiveMediaIndex(0); }}>
                        <div className="relative aspect-square overflow-hidden bg-zinc-100">
                            <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {product.video_url && <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full text-white"><Play className="w-3 h-3 fill-current" /></div>}
                            <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-zinc-900 shadow-sm">${product.price}</div>
                            
                            <Button 
                                size="icon" 
                                className="absolute top-3 right-3 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10" 
                                onClick={(e) => { e.stopPropagation(); onShare(product); }}
                            >
                                <Share2 className="w-4 h-4"/>
                            </Button>

                            {isOwner && <div className="absolute top-3 left-3 bg-zinc-900 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase shadow-md">Your Listing</div>}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold line-clamp-1 text-zinc-900">{product.name}</h3>
                            <div className="flex justify-between items-center mt-1"><div className="flex items-center gap-1.5 overflow-hidden"><Avatar className="h-4 w-4"><AvatarImage src={product.profiles?.avatar_url}/><AvatarFallback className="text-[8px] bg-zinc-200">U</AvatarFallback></Avatar><span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{isOwner ? "You" : product.profiles?.username}</span></div><span className="text-[10px] text-zinc-400">{new Date(product.created_at).toLocaleDateString()}</span></div>
                        </div>
                    </Card>
                )
            })}
        </div>

        {/* DETAILS MODAL */}
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
            <DialogContent className="max-w-[90vw] lg:max-w-6xl p-0 overflow-hidden bg-white rounded-3xl border-none h-[90vh] flex flex-col md:flex-row">
                <DialogTitle></DialogTitle>
                {selectedProduct && (() => {
                    const mediaList = getMediaList(selectedProduct); const activeMedia = mediaList[activeMediaIndex]
                    const isOwner = selectedProduct.seller_id === session.user.id
                    return (
                        <>
                        <div className="w-full md:w-3/5 bg-black flex flex-col relative group"><div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">{activeMedia.type === 'video' ? <video src={activeMedia.url} autoPlay muted loop playsInline className="w-full h-full object-contain" /> : <img src={activeMedia.url} className="w-full h-full object-contain" />}</div>{mediaList.length > 1 && (<div className="h-24 bg-zinc-900/90 border-t border-white/10 flex items-center justify-center gap-3 p-4 z-20 backdrop-blur-sm">{mediaList.map((media, idx) => (<div key={idx} onClick={() => setActiveMediaIndex(idx)} className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeMediaIndex === idx ? 'border-yellow-400 scale-105 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={selectedProduct.image_url} className="w-full h-full object-cover" />{media.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play className="w-6 h-6 text-white fill-current"/></div>}</div>))}</div>)}</div>
                        <div className="w-full md:w-2/5 flex flex-col h-full bg-white border-l border-zinc-100">
                            <div className="p-8 border-b border-zinc-50 flex justify-between items-start">
                                <div><h2 className="text-3xl font-black text-zinc-900 leading-tight mb-2">{selectedProduct.name}</h2><p className="text-4xl font-bold text-yellow-600">${selectedProduct.price}</p></div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full border-zinc-200 hover:bg-yellow-50 hover:border-yellow-300" onClick={() => onShare(selectedProduct)}>
                                        <Share2 className="w-4 h-4"/>
                                    </Button>
                                    {isOwner && <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">You Own This</Badge>}
                                </div>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="flex items-center gap-3 mb-6 p-3 bg-zinc-50 rounded-2xl w-fit"><Avatar><AvatarImage src={selectedProduct.profiles?.avatar_url}/><AvatarFallback>S</AvatarFallback></Avatar><div><p className="text-sm font-bold">{isOwner ? "You (Seller)" : selectedProduct.profiles?.username}</p><p className="text-xs text-zinc-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Listed {new Date(selectedProduct.created_at).toLocaleDateString()}</p></div></div>
                                <h3 className="font-bold mb-2">Description</h3><p className="text-zinc-500 leading-relaxed whitespace-pre-wrap">{selectedProduct.description || "No description provided."}</p>
                            </div>
                            <div className="p-8 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] space-y-3">
                                 {isOwner ? (
                                     <div className="grid grid-cols-2 gap-3"><Button variant="outline" className="h-14 rounded-xl text-base border-zinc-200" onClick={() => alert("Edit functionality coming soon")}><Edit className="w-5 h-5 mr-2"/> Edit Item</Button><Button variant="destructive" className="h-14 rounded-xl text-base bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" onClick={() => handleDelete(selectedProduct.id)}><Trash2 className="w-5 h-5 mr-2"/> Remove</Button></div>
                                 ) : (
                                     <>
                                        <div className="grid grid-cols-2 gap-3"><Button variant="outline" className="h-14 rounded-xl text-base" onClick={() => onChat(selectedProduct.profiles)}><MessageCircle className="w-5 h-5 mr-2"/> Chat</Button><Button variant={addedIds.has(selectedProduct.id) ? "default" : "outline"} className={`h-14 rounded-xl text-base transition-all ${addedIds.has(selectedProduct.id) ? "bg-green-600 hover:bg-green-700 text-white border-none" : "border-yellow-400 text-black hover:bg-yellow-50"}`} onClick={() => addToCart(selectedProduct)}>{addedIds.has(selectedProduct.id) ? <><Check className="w-5 h-5 mr-2"/> Added</> : <><ShoppingBag className="w-5 h-5 mr-2"/> Add Cart</>}</Button></div>
                                        <Button className="w-full h-16 bg-zinc-900 hover:bg-black rounded-xl font-bold text-xl shadow-xl text-white" onClick={() => setCheckoutItem(selectedProduct)}>Buy Now</Button>
                                     </>
                                 )}
                            </div>
                        </div>
                        </>
                    )
                })()}
            </DialogContent>
        </Dialog>
    </div>
  )
}