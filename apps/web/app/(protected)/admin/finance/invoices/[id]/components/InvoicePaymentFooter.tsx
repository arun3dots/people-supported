"use client";

import React from "react";
import { Text } from "@repo/ui/components/ui";

export function InvoicePaymentFooter() {
  return (
    <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 text-md font-sans">
      {/* Payment Terms */}
      <div className="space-y-1">
        <Text size="md" weight="bold" className="text-slate-900 tracking-wider block">
          PAYMENT TERMS
        </Text>
        <Text size="md" weight="semibold" className="text-slate-800 block">
          30 Days
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 leading-relaxed block pt-0.5">
          Payment is due within 30 days from the invoice date. Please contact us if you have any questions.
        </Text>
      </div>

      {/* Bank Details */}
      <div className="space-y-1 md:text-right">
        <Text size="md" weight="bold" className="text-slate-900 tracking-wider block">
          BANK DETAILS
        </Text>
        <Text size="md" weight="semibold" className="text-slate-800 block">
          Cantra Care Home Ltd
        </Text>
        <Text size="md" weight="regular" className="text-slate-600 block">
          Sort Code: 20-33-22
        </Text>
        <Text size="md" weight="regular" className="text-slate-600 block">
          Account Number: 87654322456
        </Text>
        <Text size="md" weight="regular" className="text-slate-600 block">
          IBAN: GHGIUFY45670987JH
        </Text>
        <Text size="md" weight="regular" className="text-slate-600 block">
          SWIFT: JNVBHB8909
        </Text>
      </div>
    </div>
  );
}

