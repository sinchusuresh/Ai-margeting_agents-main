"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getStoredToken, checkAdminStatus as checkAdminStatusUtil } from "./auth-utils"

interface User {
  id?: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  company?: string
  phone?: string
  joinDate?: string
  plan: string
  trialDaysLeft?: number
  isAuthenticated: boolean
  role?: string
  isAdmin?: boolean
}

interface UserStore {
  user: User
  setUser: (userData: Partial<User>) => void
  updateUser: (userData: Partial<User>) => void
  upgradePlan: (plan: string) => void
  logout: () => void
  checkAdminStatus: () => Promise<boolean>
  initializeAuth: () => Promise<void>
  refreshUserData: () => Promise<void>
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: {
        id: "",
        name: "",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        company: "Digital Marketing Pro",
        phone: "+1 (555) 123-4567",
        joinDate: "2024-01-15",
        plan: "Free Trial",
        trialDaysLeft: 5,
        isAuthenticated: false,
        role: "user",
        isAdmin: false, // Always start as non-admin
      },
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
      upgradePlan: (plan) =>
        set((state) => ({
          user: {
            ...state.user,
            plan,
            trialDaysLeft: 0,
          },
        })),
      logout: () =>
        set(() => ({
          user: {
            id: "",
            name: "",
            firstName: "",
            lastName: "",
            email: "",
            company: "",
            phone: "",
            joinDate: "",
            plan: "Free Trial",
            trialDaysLeft: 7,
            isAuthenticated: false,
            role: "user",
            isAdmin: false,
          },
        })),
      initializeAuth: async () => {
        const token = getStoredToken()
        if (token) {
          try {
            // Fetch current user data from backend
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const userData = await response.json();
              console.log('Backend user data:', userData);
              
              // Check if the response has a nested user object
              const actualUserData = userData.user || userData;
              console.log('Actual user data to use:', actualUserData);
              
              set((state) => ({
                user: { 
                  ...state.user, 
                  ...actualUserData,
                  isAuthenticated: true
                }
              }));
            } else {
              // Fallback to token-based auth
              set((state) => ({
                user: { 
                  ...state.user, 
                  isAuthenticated: true,
                  isAdmin: false
                }
              }));
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to token-based auth
            set((state) => ({
              user: { 
                ...state.user, 
                isAuthenticated: true,
                isAdmin: false
              }
            }));
          }
          
          // Check admin status
          await get().checkAdminStatus()
        }
      },
      
      refreshUserData: async () => {
        const token = getStoredToken()
        if (token) {
          try {
            // Fetch current user data from backend
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const userData = await response.json();
              console.log('Refreshed user data:', userData);
              
              set((state) => ({
                user: { 
                  ...state.user, 
                  ...userData,
                  isAuthenticated: true
                }
              }));
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }
      },
      checkAdminStatus: async () => {
        try {
          const token = getStoredToken()
          if (!token) {
            set((state) => ({
              user: { ...state.user, isAdmin: false, role: "user" }
            }))
            return false
          }

          const { isAdmin, role } = await checkAdminStatusUtil()
          
          // Only set admin status if explicitly confirmed
          set((state) => ({
            user: { 
              ...state.user, 
              isAdmin: isAdmin === true, 
              role: role || "user" 
            }
          }))
          
          return isAdmin === true
        } catch (error) {
          console.error("Error checking admin status:", error)
          set((state) => ({
            user: { ...state.user, isAdmin: false, role: "user" }
          }))
          return false
        }
      },
    }),
    {
      name: "user-storage",
    },
  ),
)
