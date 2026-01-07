import nodemailer from 'nodemailer';
import { logger } from '../logger.js';

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

/**
 * Send email using SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    // Fallback to logging if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('emailClient.smtp_not_configured', {
            message: 'Email would be sent',
            to: options.to,
            subject: options.subject
        });
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: options.from || process.env.SMTP_FROM || `"Beekod" <${process.env.SMTP_USER}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text,
        });

        logger.info('emailClient.sent', {
            messageId: info.messageId,
            to: options.to,
            subject: options.subject
        });

        return true;
    } catch (error) {
        logger.error('emailClient.send_failed', { error, to: options.to });
        return false;
    }
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(
    productName: string,
    currentStock: number,
    threshold: number
): Promise<boolean> {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Kritik Stok Uyarısı</h2>
      <p>Aşağıdaki ürün kritik stok seviyesinin altına düştü:</p>
      
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0;">${productName}</h3>
        <p style="margin: 5px 0;"><strong>Mevcut Stok:</strong> ${currentStock} adet</p>
        <p style="margin: 5px 0;"><strong>Kritik Seviye:</strong> ${threshold} adet</p>
      </div>
      
      <p>Lütfen en kısa sürede sipariş geçin.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Bu otomatik bir bildirimdir. Beekod Platform tarafından gönderilmiştir.
      </p>
    </div>
  `;

    return sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || '',
        subject: `🚨 Kritik Stok: ${productName}`,
        html
    });
}

/**
 * Send order notification email
 */
export async function sendOrderNotification(
    orderData: any
): Promise<boolean> {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✅ Yeni Sipariş Alındı</h2>
      
      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Sipariş No:</strong> ${orderData.id}</p>
        <p style="margin: 5px 0;"><strong>Müşteri:</strong> ${orderData.customer}</p>
        <p style="margin: 5px 0;"><strong>Tutar:</strong> ${orderData.total} TL</p>
        <p style="margin: 5px 0;"><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
      </div>
      
      <p>Sipariş detaylarını görmek için panele giriş yapın.</p>
    </div>
  `;

    return sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || '',
        subject: `📦 Yeni Sipariş: ${orderData.id}`,
        html
    });
}
