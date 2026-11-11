"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Text,
} from "@repo/ui/components/ui";
import { LogOut } from "lucide-react";
import { useAuth } from "../../lib/context/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();

  const initial = user?.email ? user.email[0]?.toUpperCase() : "S";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon"
          className="size-9 rounded-xl font-bold cursor-pointer"
        >
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-white min-w-[200px] p-2"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col space-y-0.5 px-3 py-2">
          <Text size="sm" weight="semibold" className="text-slate-900">
            {user?.fullName || user?.email?.split("@")[0] || "SuperAdmin"}
          </Text>
          <Text size="xs" variant="subdued" className="truncate">
            {user?.email}
          </Text>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center py-2 text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg text-xs font-semibold"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 size-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
