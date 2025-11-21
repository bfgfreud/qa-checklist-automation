'use client'

import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface SignOutButtonProps {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className={className || 'text-gray-400 hover:text-white transition-colors'}
    >
      Sign Out
    </button>
  )
}
