"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui";
import {
  LayoutGrid,
  List,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const staff = [
  {
    id: 1,
    name: "Sarah Williams",
    role: "Superintendent",
    email: "sarah@example.com",
    phone: "+44 20 1234 5678",
    status: "Active",
    image: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: 2,
    name: "James Miller",
    role: "Nurse",
    email: "james@example.com",
    phone: "+44 20 8765 4321",
    status: "On Leave",
    image: "https://i.pravatar.cc/150?u=james",
  },
  {
    id: 3,
    name: "Emily Chen",
    role: "Care Worker",
    email: "emily@example.com",
    phone: "+44 20 5555 5555",
    status: "Active",
    image: "https://i.pravatar.cc/150?u=emily",
  },
  {
    id: 4,
    name: "Michael Ross",
    role: "Operations",
    email: "michael@example.com",
    phone: "+44 20 9999 8888",
    status: "Active",
    image: "https://i.pravatar.cc/150?u=michael",
  },
];

export function TableViewDemo() {
  const [view, setView] = useState<"list" | "card">("card");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900tracking-tight">
            Staff Directory
          </h3>
          <p className="text-md text-gray-500 font-medium">
            Manage and view all supported living staff members.
          </p>
        </div>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "card")}
          className="bg-gray-100 p-1 rounded-xl"
        >
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger
              value="list"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 flex items-center gap-2"
            >
              <List className="h-4 w-4" />{" "}
              <span className="text-md font-semibold">List</span>
            </TabsTrigger>
            <TabsTrigger
              value="card"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5 flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />{" "}
              <span className="text-md font-semibold">Cards</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "list" ? (
        <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] font-semibold">
                    Member
                  </TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Contact Info</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((person) => (
                  <TableRow key={person.id} className="border-b-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={person.image} />
                          <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                            {person.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-gray-900">
                          {person.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-md font-semibold uppercase text-gray-400">
                        {person.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-md text-gray-600 font-medium">
                          <Mail className="h-3 w-3 text-gray-400" />{" "}
                          {person.email}
                        </div>
                        <div className="flex items-center gap-2 text-md text-gray-400 font-medium">
                          <Phone className="h-3 w-3" /> {person.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          person.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }
                      >
                        {person.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff.map((person) => (
            <Card
              key={person.id}
              className="rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 border-gray-100 group"
            >
              <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl mx-auto ring-1 ring-gray-100">
                    <AvatarImage src={person.image} />
                    <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white shadow-sm ${person.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`}
                  ></div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">
                    {person.name}
                  </h4>
                  <p className="text-md font-semibold text-primary uppercase tracking-widest mt-1">
                    {person.role}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-center gap-2 text-md text-gray-500 font-medium">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    <span className="truncate max-w-[150px]">
                      {person.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-md text-gray-500 font-medium">
                    <Phone className="h-3.5 w-3.5" /> {person.phone}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl font-semibold border-gray-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
