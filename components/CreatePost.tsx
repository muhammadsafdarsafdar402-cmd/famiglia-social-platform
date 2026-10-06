"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Image as ImageIcon, Video, Send, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next' // <--- IMPORT

export default function CreatePost({ user_id }: { user_id: string }) {
  const { t } = useTranslation(); // <--- HOOK
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const selectedFile = e.target.files?.[0]; if (!selectedFile) return
    setFile(selectedFile); setFileType(type); setPreviewUrl(URL.createObjectURL(selectedFile))
  }

  const clearFile = () => { setFile(null); setPreviewUrl(null); setFileType(null) }

  const handlePost = async () => {
    if (!content.trim() && !file) return
    setUploading(true)
    let mediaUrl = null; let mediaType = null
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `posts/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file)
      if (uploadError) { alert("Upload failed"); setUploading(false); return }
      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
      mediaUrl = data.publicUrl; mediaType = fileType
    }
    const { error } = await supabase.from('posts').insert({ user_id, content, media_url: mediaUrl, media_type: mediaType })
    if (!error) { setContent(''); clearFile() } else { alert("Post failed") }
    setUploading(false)
  }

  return (
    <Card className="p-5 rounded-3xl border border-zinc-100 shadow-sm bg-white mb-6">
      <div className="flex gap-4">
        <Avatar className="h-11 w-11 ring-2 ring-zinc-50"><AvatarFallback className="bg-zinc-100 text-zinc-400">Me</AvatarFallback></Avatar>
        <div className="flex-1 space-y-4">
            <textarea
                className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder:text-zinc-400 text-zinc-800"
                placeholder={t('cp_placeholder')} // <--- TRANSLATED
                rows={2} value={content} onChange={(e) => setContent(e.target.value)}
            />
            {previewUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                    <Button size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full h-8 w-8 z-10 bg-black/50 hover:bg-black/70 text-white" onClick={clearFile}><X className="h-4 w-4" /></Button>
                    {fileType === 'video' ? <video src={previewUrl} controls className="w-full max-h-[400px] object-cover" /> : <img src={previewUrl} className="w-full max-h-[400px] object-cover" />}
                </div>
            )}
            <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                <div className="flex gap-2">
                    <div className="relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileSelect(e, 'image')} />
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full font-medium"><ImageIcon className="h-5 w-5 mr-2" /> {t('cp_photo')}</Button>
                    </div>
                    <div className="relative">
                        <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileSelect(e, 'video')} />
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full font-medium"><Video className="h-5 w-5 mr-2" /> {t('cp_video')}</Button>
                    </div>
                </div>
                <Button onClick={handlePost} disabled={uploading || (!content && !file)} className="rounded-full bg-yellow-400 hover:bg-yellow-500 text-black px-6 font-bold shadow-md shadow-yellow-200">
                    {uploading ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
      </div>
    </Card>
  )
}