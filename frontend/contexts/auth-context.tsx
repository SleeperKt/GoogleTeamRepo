"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

interface AuthContextType {
  token: string | null
  user: { id: string; username: string; email: string } | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("token")
    if (stored) {
      setToken(stored)
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (t: string) => {
    setToken(t)
    fetchUser(t)
    if (typeof window !== "undefined") {
      localStorage.setItem("token", t)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
  }

  const fetchUser = async (jwt: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          logout()
          return
        }
        const errorBody = await res.text()
        console.error(`Failed to fetch user: ${res.status} ${res.statusText} - ${errorBody}`)
        setIsLoading(false)
        return
      }
      const data = await res.json()
      
      const userData = { 
        id: data.userId || data.UserId || '', 
        username: data.userName || data.UserName || '', 
        email: data.email || data.Email || '' 
      }
      setUser(userData)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching user:', err)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchUser(token)
  }, [token])

  return <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 