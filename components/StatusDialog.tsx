import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatusDialogProps {
  isOpen: boolean
  type: "success" | "error" | "loading" | null
  title: string
  message: string
  onClose: () => void
}

export default function StatusDialog({ isOpen, type, title, message, onClose }: StatusDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
        <div className={`h-2 w-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
        
        <div className="flex flex-col items-center text-center p-8 space-y-4">
          
          {/* ICON ANIMATION */}
          <div className="relative">
            {type === 'success' && (
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            )}
            {type === 'error' && (
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
            {type === 'loading' && (
              <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}
          </div>

          {/* TEXT */}
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{message}</p>
          </div>

          {/* BUTTON (Hide if loading) */}
          {type !== 'loading' && (
            <Button 
              onClick={onClose}
              className={`w-full rounded-xl h-11 font-medium ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {type === 'success' ? "Continue" : "Try Again"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}