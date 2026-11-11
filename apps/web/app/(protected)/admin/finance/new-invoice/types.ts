export interface InvoiceItemForm {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface NewInvoiceFormValues {
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  paymentTerms: string;
  reference?: string;

  billToType: "Resident" | "Organisation / Payer";
  residentId: string;
  payerName?: string;
  addressLine1: string;
  city: string;
  email: string;
  phone: string;
  postcode: string;
  country: string;

  items: InvoiceItemForm[];
  notes?: string;
}
