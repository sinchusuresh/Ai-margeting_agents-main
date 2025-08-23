"use client"

import { ReactNode } from "react"
import { useAdmin } from "@/hooks/use-admin"

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  showLoading?: boolean
}

export function AdminOnly({ children, fallback = null, showLoading = true }: AdminOnlyProps) {
  const { isAdmin, isLoading } = useAdmin()

  // Always return null during loading to prevent any flash of admin content
  if (isLoading) {
    return null
  }

  // Only show children if explicitly confirmed as admin
  if (!isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
} 