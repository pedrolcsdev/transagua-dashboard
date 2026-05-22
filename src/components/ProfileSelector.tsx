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
  getProfileLabel,
  profileOptions,
  type UserProfile,
} from "@/lib/profile"

type ProfileSelectorProps = {
  profile: UserProfile
  onProfileChange: (profile: UserProfile) => void
}

export function ProfileSelector({
  profile,
  onProfileChange,
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
        <span className="hidden text-sm text-[#6a8284] sm:inline">Perfil</span>
        <span className="text-sm font-semibold">{getProfileLabel(profile)}</span>
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Selecionar perfil</DropdownMenuLabel>
          {profileOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onProfileChange(option.value)}
            >
              <span>{option.label}</span>
              {profile === option.value && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
