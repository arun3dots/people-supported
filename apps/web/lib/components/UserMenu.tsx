"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useGetMyProfileQuery } from "../queries/profile/useMyProfileQueries";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { data: profile } = useGetMyProfileQuery({
    enabled: !!user,
  });

  const getProfileLink = () => {
    return "/profile";
  };

  const photoUrl = profile?.profilePhotoUrl;
  const displayName =
    user?.fullName || profile?.fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 focus:outline-none focus:ring-0 cursor-pointer group text-left">
          <Avatar size="default" className="border border-border shrink-0">
            {photoUrl && (
              <AvatarImage
                src={photoUrl}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="text-left hidden sm:block">
            <div className="text-sm font-bold text-[#141F1E] font-sans leading-tight">
              {displayName}
            </div>
            <div className="text-xs text-[#5D5D5D] font-sans font-medium">
              {user?.roleName || profile?.role?.name || "Staff"}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-white min-w-[220px] rounded-xl shadow-lg border border-slate-200"
        align="end"
        sideOffset={10}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar size="sm" className="border border-border shrink-0">
            {photoUrl && (
              <AvatarImage
                src={photoUrl}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 min-w-0">
            <p className="text-sm font-semibold leading-tight text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email || profile?.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <Link href={getProfileLink()}>
          <DropdownMenuItem className="flex cursor-pointer items-center py-2.5">
            <UserIcon className="mr-2 h-4 w-4" />
            <span className="flex-1 text-sm">Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className="flex cursor-pointer items-center py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="flex-1 text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

