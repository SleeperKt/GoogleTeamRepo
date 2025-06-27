"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

interface AuthContextType {
  token: string | null
  user: { id: string; username: string; email: string; bio?: string } | null
  isLoading: boolean
  isHydrated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; username: string; email: string; bio?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Start as false to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false) // Track if we've hydrated

  // Handle hydration and localStorage access
  useEffect(() => {
    // Mark as hydrated and check for stored token
    setIsHydrated(true)
    
    const stored = localStorage.getItem("token")
    if (stored) {
      setToken(stored)
      setIsLoading(true) // Only start loading after hydration
    }
  }, [])

  const login = (t: string) => {
    setToken(t)
    setIsLoading(true)
    fetchUser(t)
    if (typeof window !== "undefined") {
      localStorage.setItem("token", t)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setIsLoading(false)
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
  }

  const fetchUser = async (jwt: string) => {
    try {
      console.log("🔍 Attempting to fetch user with token:", jwt ? `${jwt.substring(0, 20)}...` : 'null')
      console.log("🌐 Making request to:", `${API_BASE_URL}/api/user/me`)
      
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { 
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
      })
      
      console.log("📡 Response status:", res.status, res.statusText)
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log("❌ Token expired or invalid, logging out")
          console.log("🔑 Token that failed:", jwt ? `${jwt.substring(0, 20)}...` : 'null')
          logout()
          return
        }
        const errorBody = await res.text()
        console.error(`Failed to fetch user: ${res.status} ${res.statusText} - ${errorBody}`)
        setIsLoading(false)
        return
      }
      
      const data = await res.json()
      console.log("✅ User data received:", data)
      
      const userData = { 
        id: data.userId || data.UserId || '', 
        username: data.userName || data.UserName || '', 
        email: data.email || data.Email || '',
        bio: data.bio || data.Bio || ''
      }
      console.log("👤 Processed user data:", userData)
      setUser(userData)
    } catch (err) {
      console.error('💥 Error fetching user:', err)
      // On network error, still try to set user with token for offline usage
      if (jwt) {
        console.log("🔄 Network error but token exists, proceeding...")
      }
    } finally {
      // Always ensure loading is set to false
      setIsLoading(false)
    }
  }

  // Only fetch user data after hydration when we have a token
  useEffect(() => {
    if (isHydrated && token && !user) {
      setIsLoading(true)
      fetchUser(token)
    } else if (isHydrated && !token) {
      setIsLoading(false)
    }
  }, [isHydrated, token, user])

  return <AuthContext.Provider value={{ token, user, login, logout, isLoading, isHydrated }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 