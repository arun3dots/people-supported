"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/Select";
import { Wing, Room } from "../../../../../lib/types/facility";

interface BedFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  wingFilter: string;
  setWingFilter: (value: string) => void;
  roomFilter: string;
  setRoomFilter: (value: string) => void;
  wings: Wing[];
  rooms: Room[];
}

export function BedFilters({
  statusFilter,
  setStatusFilter,
  wingFilter,
  setWingFilter,
  roomFilter,
  setRoomFilter,
  wings,
  rooms,
}: BedFiltersProps) {
  // Only show rooms for the selected wing if a wing is selected
  const availableRooms = wingFilter === "all" ? rooms : rooms.filter((r) => r.wingId === wingFilter);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex-1 space-y-1.5">
        <label className="text-md font-semibold text-foreground/80">Status</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-1.5">
        <label className="text-md font-semibold text-foreground/80">Floor / Wing</label>
        <Select value={wingFilter} onValueChange={(val) => {
          setWingFilter(val);
          setRoomFilter("all"); // Reset room when wing changes
        }}>
          <SelectTrigger>
            <SelectValue placeholder="All Floors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {wings.map((wing) => (
              <SelectItem key={wing.id} value={wing.id}>
                {wing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-1.5">
        <label className="text-md font-semibold text-foreground/80">Room</label>
        <Select value={roomFilter} onValueChange={setRoomFilter} disabled={availableRooms.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder="All Rooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            {availableRooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.roomNumber} {room.name ? `(${room.name})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
