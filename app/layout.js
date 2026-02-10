import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from "react-hot-toast";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: 'ID Registry',
  description: 'Lost and Found ID System',
}

const localization = {
  errors: {
    password_pwned: "This password has been leaked before. Please use a more unique one for your safety.",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider 
      localization={localization}
      appearance={{
        layout: {
          shimmer: true,
          logoPlacement: "none", // Removes logo entirely to save maximum vertical space
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton", 
        },
        elements: {
          rootBox: "mx-auto my-0",
          card: "shadow-none border-0 sm:shadow-md sm:border p-0", 
          header: "mb-2 mt-0", // Minimal top margin
          headerTitle: "text-lg font-black uppercase tracking-tighter leading-tight",
          headerSubtitle: "text-[10px] font-bold text-slate-400 mt-0",
          formFieldLabel: "text-[10px] font-black uppercase mb-1",
          formFieldInput: "h-9 text-sm rounded-lg border-slate-200 py-1", // Shorter inputs
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 h-10 rounded-lg text-xs font-bold uppercase tracking-widest mt-2",
          footer: "mt-[-1.5rem]", // Pulls the "Sign up" link significantly higher
          footerAction: "py-2",
          identityPreview: "hidden", // Hides the extra email display on some screens
        }
      }}
    >
      <html lang="en">
        <body className="antialiased bg-slate-50">
          <Toaster position="top-center" reverseOrder={false} />
          <AppShell>
            {children}
          </AppShell>
        </body>
      </html>
    </ClerkProvider>
  )
}