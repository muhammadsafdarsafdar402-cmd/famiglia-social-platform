import { EmojiProvider } from '@/components/EmojiContext' // <--- IMPORT THIS

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EmojiProvider> {/* <--- WRAP EVERYTHING HERE */}
           {children}
        </EmojiProvider>
      </body>
    </html>
  )
}