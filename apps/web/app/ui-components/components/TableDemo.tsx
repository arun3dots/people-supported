"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@repo/ui/components/ui";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
    date: "2023-11-20",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
    date: "2023-11-21",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
    date: "2023-11-22",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
    date: "2023-11-23",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
    date: "2023-11-24",
  },
];

export function TableDemo() {
  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="rounded-[20px] shadow-sm overflow-hidden border-gray-100">
        <CardHeader className="bg-gray-50/50 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Standard Table
          </CardTitle>
          <CardDescription>
            A basic table with consistent spacing and typography.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[100px] font-semibold">
                  Invoice
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Method</TableHead>
                <TableHead className="font-semibold text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoice}>
                  <TableCell className="font-semibold text-gray-900">
                    {invoice.invoice}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        invoice.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100"
                          : invoice.paymentStatus === "Pending"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100"
                      }
                    >
                      {invoice.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {invoice.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-gray-800">
                    {invoice.totalAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[20px] border-dashed bg-gray-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Table Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-md text-gray-600 font-medium">
              <li>
                Use{" "}
                <code className="text-primary font-semibold">TableHead</code>{" "}
                for descriptive headers.
              </li>
              <li>
                Align numerical data to the{" "}
                <code className="text-primary font-semibold">right</code>.
              </li>
              <li>
                Utilise{" "}
                <code className="text-primary font-semibold">Badges</code> for
                status indications.
              </li>
              <li>
                Maintain consistent row height using{" "}
                <code className="text-primary font-semibold">py-4</code>.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
