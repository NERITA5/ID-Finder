import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from "react-hot-toast";
import AppShell from "@/components/AppShell"; // We will create this

export const metadata = {
  title: 'ID Registry',
  description: 'Lost and Found ID System',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-slate-50">
          <Toaster position="top-center" reverseOrder={false} />
          {/* Use the AppShell to handle client-side logic */}
          <AppShell>
            {children}
          </AppShell>
        </body>
      </html>
    </ClerkProvider>
  )
}