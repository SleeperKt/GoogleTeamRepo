"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

interface AuthContextType {
  token: string | null
  user: { id: string; username: string; email: string } | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("token")
    if (stored) setToken(stored)
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
        return
      }
      const data = await res.json()
      
      const userData = { 
        id: data.userId || data.UserId || '', 
        username: data.userName || data.UserName || '', 
        email: data.email || data.Email || '' 
      }
      setUser(userData)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  useEffect(() => {
    if (token) fetchUser(token)
  }, [token])

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 