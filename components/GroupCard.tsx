import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function GroupCard({ group }: { group: any }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200 group bg-white rounded-3xl">
      {/* Cover Image */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
         {group.image_url && <img src={group.image_url} className="w-full h-full object-cover opacity-80" />}
      </div>
      
      <div className="p-5 pt-0">
        {/* Group Icon (Overlapping) */}
        <div className="flex justify-between items-start">
            <Avatar className="h-16 w-16 border-4 border-white -mt-8 rounded-2xl shadow-sm bg-white">
                <AvatarFallback className="rounded-2xl bg-zinc-100 text-zinc-500 font-bold text-xl">
                    {group.name[0]}
                </AvatarFallback>
                {group.image_url && <AvatarImage src={group.image_url} />}
            </Avatar>
            <Button variant="ghost" size="icon" className="mt-2 text-zinc-400 hover:text-zinc-600">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
        </div>

        {/* Info */}
        <div className="mt-3">
            <h3 className="font-bold text-lg text-zinc-900 leading-tight">{group.name}</h3>
            <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{group.description || "A community for enthusiasts."}</p>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-50 pt-4">
            <div className="flex items-center text-xs text-zinc-500 font-medium">
                <Users className="h-4 w-4 mr-1.5 text-indigo-500" />
                <span>1.2k Members</span>
            </div>
            <Button size="sm" className="rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors font-semibold">
                Join
            </Button>
        </div>
      </div>
    </Card>
  )
}