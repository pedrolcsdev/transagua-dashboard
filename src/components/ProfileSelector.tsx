import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { appUsers, getProfileLabel, type AppUser } from "@/lib/profile"

type ProfileSelectorProps = {
  user: AppUser
  onUserChange: (user: AppUser) => void
}

export function ProfileSelector({ user, onUserChange }: ProfileSelectorProps) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-2xl border-[#dfe8ea] bg-white px-2.5 pr-3 text-[#173b3d] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-[#eef7f6]"
          />
        }
      >
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#101820] text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
          <span className="max-w-28 truncate text-sm font-semibold">
            {user.name}
          </span>
          <span className="text-xs text-[#6a8284]">
            {getProfileLabel(user.profile)}
          </span>
        </span>
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
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
