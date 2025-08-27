"use client"

import { useState, useEffect } from "react"
import { useUserStore } from "@/lib/user-store"

export function useAdmin() {
  const { user, checkAdminStatus, initializeAuth } = useUserStore()
  const [isLoading, setIsLoading] = useState(true) // Start with loading true to prevent flash
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Always start with not admin until explicitly confirmed
        setIsAdmin(false)
        
        // Initialize auth and check admin status
        await initializeAuth()
        
        // Only check admin status if user is authenticated
        if (user.isAuthenticated) {
          const adminStatus = await checkAdminStatus()
          // Only set as admin if explicitly confirmed
          setIsAdmin(adminStatus === true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error initializing admin status:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [user.isAuthenticated, checkAdminStatus, initializeAuth])

  return {
    isAdmin,
    isLoading,
    userRole: user.role
  }
} 