/**
 * Service to generate HTML for shipping labels
 */

export const labelService = {
  generateLabelHtml(trackingNumber: string, provider: 'yurtici' | 'aras' | 'mng' = 'yurtici', orderData?: any): string {
    const date = new Date().toLocaleDateString('tr-TR');
    
    // Provider specific styling
    const styles: Record<string, { color: string; name: string; routing: string; textColor?: string }> = {
        yurtici: { color: '#FFD400', name: 'YURTİÇİ', routing: 'TR-34' },
        aras: { color: '#004892', name: 'ARAS KARGO', routing: 'TR-06', textColor: 'white' },
        mng: { color: '#F37021', name: 'MNG KARGO', routing: 'TR-35', textColor: 'white' }
    };

    const style = styles[provider] || styles.yurtici;
    const headerTextColor = style.textColor || '#2c3e50';

    const sender = {
      name: "Beekod Mağazacılık A.Ş.",
      address: "Teknoloji Vadisi, No: 123",
      city: "İstanbul / Kadıköy",
      phone: "+90 850 123 45 67"
    };

    // Mock recipient if no data provided
    const recipient = orderData?.customer || {
      name: "Sayın Müşteri",
      address: "Teslimat Adresi Mah. Örnek Cad. No:1",
      city: "Ankara / Çankaya",
      phone: "+90 555 123 45 67"
    };

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kargo Etiketi - ${trackingNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            background: #f3f4f6;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
        }

        .label-container {
            width: 100mm; /* Standard label width */
            height: 150mm; /* Standard label height */
            background: white;
            padding: 0;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            background: ${style.color};
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            color: ${headerTextColor};
        }

        .logo {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -1px;
        }

        .routing-code {
            font-size: 32px;
            font-weight: 800;
            border: 3px solid ${headerTextColor === 'white' ? 'white' : 'black'};
            padding: 4px 12px;
            border-radius: 6px;
        }

        .section {
            padding: 15px 20px;
            border-bottom: 1px dashed #ccc;
        }

        .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 4px;
            font-weight: 700;
        }

        .value {
            font-size: 14px;
            font-weight: 600;
            color: #000;
            line-height: 1.4;
        }

        .barcode-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #fff;
        }

        .barcode-lines {
            height: 60px;
            width: 80%;
            background: repeating-linear-gradient(
                90deg,
                #000 0px,
                #000 2px,
                transparent 2px,
                transparent 4px,
                #000 4px,
                #000 8px
            );
            margin-bottom: 10px;
        }

        .tracking-number {
            font-family: monospace;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 2px;
        }

        .footer {
            background: #f8f9fa;
            padding: 10px 20px;
            font-size: 10px;
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        /* Print styles */
        @media print {
            body { 
                background: white; 
                padding: 0; 
                display: block;
            }
            .label-container {
                box-shadow: none;
                margin: 0;
                width: 100%;
                height: 100%;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>

    <div class="label-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">${style.name}</div>
            <div class="routing-code">${style.routing}</div>
        </div>

        <!-- Sender (Small) -->
        <div class="section" style="background: #fafafa;">
            <div class="label">GÖNDERİCİ</div>
            <div class="value" style="font-size: 12px;">
                ${sender.name}<br>
                ${sender.city}
            </div>
        </div>

        <!-- Receiver (Big) -->
        <div class="section">
            <div class="label">ALICI</div>
            <div class="value" style="font-size: 16px;">
                <strong>${recipient.name}</strong><br>
                ${recipient.address}<br>
                ${recipient.city}
            </div>
            <div class="value" style="margin-top: 8px;">
                Tel: <strong>${recipient.phone}</strong>
            </div>
        </div>

        <!-- Payment Info -->
        <div class="section grid-2">
            <div>
                <div class="label">TARİH</div>
                <div class="value">${date}</div>
            </div>
            <div>
                <div class="label">ÖDEME TİPİ</div>
                <div class="value">GÖNDERİCİ ÖDEMELİ</div>
            </div>
        </div>

        <div class="section">
            <div class="label">İÇERİK / NOT</div>
            <div class="value">E-Ticaret Siparişi</div>
        </div>

        <!-- Barcode -->
        <div class="barcode-area">
            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${trackingNumber}&scale=3&height=10&incltext=false" 
                 alt="Barcode" 
                 style="height: 60px; width: 80%; object-fit: contain;" 
            />
            <div class="tracking-number">${trackingNumber}</div>
        </div>

        <div class="footer">
            Beekod Lojistik Entegrasyonu ile oluşturulmuştur.<br>
            Bu etiket resmi belge yerine geçmez (Simülasyon).
        </div>
    </div>

    <script>
        // Auto print on load (optional, might get annoying during dev)
        // window.onload = () => window.print();
    </script>
</body>
</html>
    `;
  }
};
