"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { profileApi } from "@/lib/api"

export default function ProfilePage() {
  const { user, token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
    // Clear any existing messages when user starts typing
    setError(null)
    setSuccess(null)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
    // Clear any existing messages when user starts typing
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!token) {
      setError("You must be logged in to update your profile")
      return
    }

    // Basic validation
    if (!formData.username.trim()) {
      setError("Username is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    // Bio length validation
    if (formData.bio.length > 500) {
      setError("Bio must be 500 characters or less")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await profileApi.updateProfile({
        userName: formData.username,
        email: formData.email,
        bio: formData.bio
      })
      
      setSuccess("Profile updated successfully!")
      
      // Force refresh user data in auth context
      window.location.reload()
    } catch (err) {
      console.error("Error updating profile:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to update profile. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Your username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">
              Bio <span className="text-sm text-gray-500">(Optional - Max 500 characters)</span>
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleTextareaChange}
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
              disabled={isLoading}
              maxLength={500}
            />
            <p className="text-sm text-gray-500">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
