import puppeteer from 'puppeteer';
import { IInvoice } from '../models/Invoice.js';
import { logger } from '../logger.js';

export class PdfService {
    /**
     * Generate HTML template for invoice
     */
    private generateInvoiceHtml(invoice: IInvoice): string {
        const totalTax = invoice.taxAmount;
        const subtotal = invoice.subtotal;
        const total = invoice.totalAmount;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: bold; color: #F5B800; }
                .invoice-details { text-align: right; }
                .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
                .bill-to { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .totals { float: right; width: 300px; }
                .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
                .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; paddingTop: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">BEEKOD</div>
                <div class="invoice-details">
                    <div class="invoice-title">FATURA</div>
                    <div>No: ${invoice.invoiceNumber}</div>
                    <div>Tarih: ${new Date(invoice.date).toLocaleDateString('tr-TR')}</div>
                </div>
            </div>

            <div class="bill-to">
                <strong>Sayın:</strong><br>
                ${invoice.customer.name}<br>
                ${invoice.customer.address || ''}<br>
                ${invoice.customer.taxId ? `VKN/TCKN: ${invoice.customer.taxId}` : ''}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Açıklama</th>
                        <th>Miktar</th>
                        <th>Birim Fiyat</th>
                        <th>KDV</th>
                        <th>Toplam</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unitPrice.toFixed(2)} ${invoice.currency}</td>
                        <td>%${item.taxRate}</td>
                        <td>${item.total.toFixed(2)} ${invoice.currency}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Ara Toplam:</span>
                    <span>${subtotal.toFixed(2)} ${invoice.currency}</span>
                </div>
                <div class="total-row">
                    <span>KDV Toplam:</span>
                    <span>${totalTax.toFixed(2)} ${invoice.currency}</span>
                </div>
                <div class="total-row final-total">
                    <span>GENEL TOPLAM:</span>
                    <span>${total.toFixed(2)} ${invoice.currency}</span>
                </div>
            </div>
            
            <div style="clear: both; margin-top: 50px; font-size: 12px; color: #777; text-align: center;">
                Bu fatura Beekod sistemi tarafından otomatik oluşturulmuştur.
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Create PDF buffer from invoice
     */
    async createInvoicePdf(invoice: IInvoice): Promise<Buffer> {
        logger.info('pdf.create_start', { invoiceNumber: invoice.invoiceNumber });
        try {
            const html = this.generateInvoiceHtml(invoice);

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Generate PDF as Uint8Array (Puppeteer v23+ types might return Uint8Array)
            const pdfUint8Array = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
            });

            await browser.close();

            // Convert Uint8Array to Buffer explicitly to match return type
            return Buffer.from(pdfUint8Array);

        } catch (error) {
            logger.error('pdf.create_failed', { error });
            throw new Error('Failed to generate PDF');
        }
    }
}

export const pdfService = new PdfService();
