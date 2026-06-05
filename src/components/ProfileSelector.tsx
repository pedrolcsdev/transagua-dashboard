import { ChevronDown, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  appUsers,
  getProfileLabel,
  type AppUser,
} from "@/lib/profile"

type ProfileSelectorProps = {
  user: AppUser
  onUserChange: (user: AppUser) => void
}

export function ProfileSelector({
  user,
  onUserChange,
}: ProfileSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 border-[#c9dddd] bg-white px-3 text-[#173b3d] shadow-sm hover:bg-[#edf7f6]"
          />
        }
      >
        <span className="hidden text-sm text-[#6a8284] sm:inline">
          {getProfileLabel(user.profile)}
        </span>
        <span className="text-sm font-semibold">{user.name}</span>
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Selecionar usuário</DropdownMenuLabel>
          {appUsers.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => onUserChange(option)}
            >
              <span className="flex flex-col">
                <span>{option.name}</span>
                <span className="text-xs text-muted-foreground">
                  {getProfileLabel(option.profile)}
                </span>
              </span>
              {user.id === option.id && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
