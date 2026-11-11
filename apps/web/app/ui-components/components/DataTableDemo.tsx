"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
  Filter,
  Download,
  Plus,
} from "lucide-react";

const data = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    status: "Active",
    lastSeen: "2 hours ago",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@smith.com",
    role: "Editor",
    status: "Inactive",
    lastSeen: "5 days ago",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@brown.io",
    role: "Viewer",
    status: "Active",
    lastSeen: "Just now",
  },
  {
    id: "4",
    name: "Diana Prince",
    email: "diana@themyscira.com",
    role: "Admin",
    status: "Active",
    lastSeen: "1 day ago",
  },
  {
    id: "5",
    name: "Edward Norton",
    email: "ed@fightclub.com",
    role: "Editor",
    status: "Pending",
    lastSeen: "3 hours ago",
  },
  {
    id: "6",
    name: "Fiona Gallagher",
    email: "fiona@shameless.com",
    role: "Viewer",
    status: "Active",
    lastSeen: "1 week ago",
  },
  {
    id: "7",
    name: "George Costanza",
    email: "george@vandelay.com",
    role: "Viewer",
    status: "Inactive",
    lastSeen: "2 weeks ago",
  },
];

export function DataTableDemo() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [searchQuery, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 font-semibold gap-2"
          >
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 font-semibold gap-2"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="rounded-xl font-semibold gap-2 bg-primary">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b-gray-100">
                <TableHead className="w-[250px]">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-semibold text-gray-700 gap-2"
                    onClick={() => toggleSort("name")}
                  >
                    User Name <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Last Seen
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((user) => (
                  <TableRow key={user.id} className="border-b-gray-50 group">
                    <TableCell className="font-semibold text-gray-900">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-gray-500 font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className="text-md font-semibold uppercase tracking-wider text-gray-400">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : user.status === "Pending"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-md font-medium">
                      {user.lastSeen}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl border-gray-100 shadow-xl"
                        >
                          <DropdownMenuItem className="font-medium cursor-pointer rounded-lg m-1">
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="font-medium cursor-pointer rounded-lg m-1">
                            Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="font-medium text-rose-600 cursor-pointer rounded-lg m-1">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-gray-400 font-medium"
                  >
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-2">
        <p className="text-md text-gray-400 font-medium">
          Showing{" "}
          <span className="text-gray-900 font-semibold">
            {filteredData.length}
          </span>{" "}
          of <span className="text-gray-900 font-semibold">{data.length}</span>{" "}
          results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg font-semibold border-gray-200 px-4"
            disabled
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg font-semibold border-gray-200 px-4"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
