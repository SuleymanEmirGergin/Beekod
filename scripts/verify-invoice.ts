import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function verifyInvoiceAPI() {
    try {
        console.log("1. Creating Invoice...");
        const createRes = await axios.post(`${API_URL}/invoices`, {
            customer: {
                name: "Test Customer",
                email: "test@example.com",
                address: "Pendik, Istanbul"
            },
            items: [
                { description: "Test Product 1", quantity: 2, unitPrice: 100 },
                { description: "Service Charge", quantity: 1, unitPrice: 50 }
            ],
            notes: "Verification Test"
        });

        const newInvoice = createRes.data;
        console.log("✅ Invoice Created:", newInvoice.invoiceNumber);

        console.log("2. Listing Invoices...");
        const listRes = await axios.get(`${API_URL}/invoices`);
        const found = listRes.data.find((inv: any) => inv._id === newInvoice._id);

        if (found) {
            console.log("✅ Created invoice found in list.");
        } else {
            console.error("❌ Created invoice NOT found in list.");
        }

        console.log("3. Updating Status...");
        const updateRes = await axios.put(`${API_URL}/invoices/${newInvoice._id}/status`, {
            status: 'SENT'
        });

        if (updateRes.data.status === 'SENT') {
            console.log("✅ Status updated to SENT.");
        } else {
            console.error("❌ Status update failed.");
        }

    } catch (error: any) {
        console.error("❌ Verification Failed:", error.response ? error.response.data : error.message);
    }
}

verifyInvoiceAPI();
