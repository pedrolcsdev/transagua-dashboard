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
            className="h-11 gap-2 rounded-2xl border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 pr-3 text-[var(--text-primary)] shadow-[0_10px_30px_var(--shadow-color)] hover:bg-[var(--accent-soft)]"
          />
        }
      >
        <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--text-primary)] text-xs font-bold text-[var(--bg-elevated)]">
          {initials}
        </span>
        <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
          <span className="max-w-28 truncate text-sm font-semibold">
            {user.name}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
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
