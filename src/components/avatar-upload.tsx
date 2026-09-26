"use client"

import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  fullName?: string
  onAvatarChange: (newUrl: string | null) => void
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  fullName = "",
  onAvatarChange,
}: AvatarUploadProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const getInitials = (name: string) => {
    if (!name.trim()) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return parts[0][0].toUpperCase()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Image Type Validation
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "Invalid File Type",
        description: "Please select a valid image file (JPEG, PNG, WebP).",
        type: "error",
      })
      return
    }

    // 2. Size Validation (Max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.add({
        title: "File Too Large",
        description: "Avatar image must be under 2MB.",
        type: "error",
      })
      return
    }

    setUploading(true)

    try {
      // Create local preview immediately for fast feedback
      const localPreviewUrl = URL.createObjectURL(file)
      onAvatarChange(localPreviewUrl)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // Fall back to base64 Data URL if storage bucket fails
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          onAvatarChange(base64)
          toast.add({
            title: "Avatar Saved",
            description: "Profile photo saved locally to profile.",
            type: "success",
          })
        }
        reader.readAsDataURL(file)
      } else {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
        const publicUrl = data.publicUrl
        onAvatarChange(publicUrl)
        toast.add({
          title: "Avatar Uploaded",
          description: "Profile photo updated successfully.",
          type: "success",
        })
      }
    } catch (err: unknown) {
      console.error("Avatar upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    onAvatarChange(null)
    toast.add({
      title: "Avatar Removed",
      description: "Profile photo reset to default initials.",
      type: "info",
    })
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={fullName || "User avatar"}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30 shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl font-black text-primary shadow-lg">
            {getInitials(fullName)}
          </div>
        )}

        <label
          htmlFor="avatar-input"
          className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white text-xs font-bold"
        >
          {uploading ? "Uploading..." : "Change"}
        </label>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-neutral-100">Profile Photo</h4>
        <div className="flex gap-2">
          <label
            htmlFor="avatar-input"
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </label>
          {currentAvatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">Allowed formats: JPG, PNG, WebP (max 2MB)</p>
      </div>
    </div>
  )
}
