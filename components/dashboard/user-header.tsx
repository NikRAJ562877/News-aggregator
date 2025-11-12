"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { UserProfile } from "@/Types/user"
import { LogOut, Settings } from "lucide-react"

interface UserHeaderProps {
  user: UserProfile
}

export function UserHeader({ user }: UserHeaderProps) {
  return (
    <Card className="border-b-2">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive bg-transparent">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
