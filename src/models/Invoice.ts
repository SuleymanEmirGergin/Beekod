export interface IInvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export interface IInvoice {
  id?: number;
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  customer: {
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: IInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "OVERDUE";
  category: "Lojistik" | "Ürün Tedariği" | "Hizmet" | "Ofis Giderleri" | "Pazarlama" | "Diğer";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function mapInvoice(row: any, items: any[] = []): IInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    date: new Date(row.date),
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    customer: {
      name: row.customer_name,
      taxId: row.customer_tax_id,
      taxOffice: row.customer_tax_office,
      address: row.customer_address,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    items: items.map((item) => ({
      id: item.id,
      invoice_id: item.invoice_id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      total: Number(item.total),
      taxRate: item.tax_rate,
    })),
    subtotal: Number(row.subtotal),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    status: row.status,
    category: row.category,
    notes: row.notes,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}
