import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '../../services/invoice';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceCreateModalProps {
  onClose: () => void;
  initialData?: any;
}

interface InvoiceFormValues {
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerTaxId: string;
  date: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
  notes: string;
}

export function InvoiceCreateModal({ onClose, initialData }: InvoiceCreateModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        customerName: initialData.customer?.name || '',
        customerEmail: initialData.customer?.email || '',
        customerAddress: initialData.customer?.address || '',
        customerTaxId: initialData.customer?.taxId || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        items: initialData.items?.map((item: any) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 20,
        })) || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
      });
    }
  }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success('Fatura başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: () => {
      toast.error('Fatura oluşturulurken bir hata oluştu');
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    createMutation.mutate({
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        address: data.customerAddress,
        taxId: data.customerTaxId,
      },
      date: data.date,
      items: data.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
      notes: data.notes,
    });
  };

  // Calculations
  const watchedItems = watch('items');
  const subtotal = watchedItems.reduce(
    (acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice) || 0),
    0,
  );
  const taxTotal = watchedItems.reduce((acc, item) => {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice) || 0;
    return acc + lineTotal * (Number(item.taxRate) / 100);
  }, 0);
  const total = subtotal + taxTotal;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yeni Fatura Oluştur</h2>
              <p className="text-sm text-gray-500">Müşteri ve ürün bilgilerini giriniz.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Müşteri Bilgileri
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Müşteri / Firma Adı *
                    </label>
                    <input
                      {...register('customerName', { required: 'Müşteri adı zorunludur' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                    {errors.customerName && (
                      <span className="text-red-500 text-xs">{errors.customerName.message}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vergi No / T.C.
                      </label>
                      <input
                        {...register('customerTaxId')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                        placeholder="Opsiyonel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta
                      </label>
                      <input
                        {...register('customerEmail')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                        placeholder="ornek@mail.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea
                      {...register('customerAddress')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                      placeholder="Fatura adresi..."
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Fatura Detayları
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fatura Tarihi
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    {...register('notes')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5B800] focus:border-transparent"
                    placeholder="Fatura notu ekleyin..."
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-semibold text-gray-900">Hizmet / Ürün Kalemleri</h3>
                <button
                  type="button"
                  onClick={() =>
                    append({ description: '', quantity: 1, unitPrice: 0, taxRate: 20 })
                  }
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Satır Ekle
                </button>
              </div>

              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                  <div className="col-span-5">Açıklama</div>
                  <div className="col-span-2 text-center">Miktar</div>
                  <div className="col-span-2 text-right">Birim Fiyat</div>
                  <div className="col-span-1 text-center">KDV %</div>
                  <div className="col-span-2 text-right">Toplam</div>
                </div>

                {fields.map((field, index) => {
                  const qty = Number(watch(`items.${index}.quantity`) || 0);
                  const price = Number(watch(`items.${index}.unitPrice`) || 0);
                  const lineTotal = qty * price;

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-2 rounded-lg group"
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <input
                          {...register(`items.${index}.description`, { required: true })}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-[#F5B800]"
                          placeholder="Ürün veya hizmet adı"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#F5B800]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { required: true, min: 0 })}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm text-right focus:outline-none focus:border-[#F5B800]"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          {...register(`items.${index}.taxRate`)}
                          className="w-full px-0 py-1.5 bg-transparent border-none text-sm text-center focus:ring-0 cursor-pointer"
                        >
                          <option value="0">%0</option>
                          <option value="1">%1</option>
                          <option value="10">%10</option>
                          <option value="20">%20</option>
                        </select>
                      </div>
                      <div className="col-span-2 text-right font-medium text-gray-900 text-sm">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
                          lineTotal,
                        )}{' '}
                        ₺
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Ara Toplam</span>
                    <span>
                      {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
                        subtotal,
                      )}{' '}
                      ₺
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>KDV Toplam</span>
                    <span>
                      {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(
                        taxTotal,
                      )}{' '}
                      ₺
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-gray-200">
                    <span>GENEL TOPLAM</span>
                    <span>
                      {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(total)} ₺
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-[#F5B800] hover:bg-[#E5A800] text-gray-900 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Faturayı Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
