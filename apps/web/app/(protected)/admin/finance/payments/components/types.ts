export interface PaymentItem {
  id: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  reference?: string | null;
  status?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    resident?: {
      id: string;
      fullName: string;
      photoUrl?: string | null;
      bed?: {
        room?: {
          roomNumber?: string;
        } | null;
      } | null;
    } | null;
  } | null;
}
