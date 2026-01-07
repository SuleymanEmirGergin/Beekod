import api from './api';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    email?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  date: string;
  dueDate?: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  category?: 'Lojistik' | 'Ürün Tedariği' | 'Hizmet' | 'Ofis Giderleri' | 'Pazarlama' | 'Diğer';
  notes?: string;
}

export const getInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data;
};

export const createInvoice = async (data: any) => {
  const response = await api.post('/invoices', data);
  return response.data;
};

export const updateInvoiceStatus = async (id: string, status: string) => {
  const response = await api.put(`/invoices/${id}/status`, { status });
  return response.data;
};

export const createBulkInvoices = async (orderIds: string[]) => {
  const response = await api.post('/invoices/bulk-from-orders', { orderIds });
  return response.data;
};

export const scanInvoice = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/invoices/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
export const officialiseInvoice = async (id: string) => {
  const response = await api.post(`/invoices/${id}/officialise`);
  return response.data;
};
