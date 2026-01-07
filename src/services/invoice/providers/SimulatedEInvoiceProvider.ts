import { IInvoice } from "../../../models/Invoice.js";
import { logger } from "../../../logger.js";

export interface IEInvoiceProvider {
    /**
     * Sends invoice to GIB/Integrator
     * Returns GIB Invoice Number (ETTN)
     */
    officialiseInvoice(invoice: IInvoice): Promise<{ ettn: string; status: string }>;
}

export class SimulatedEInvoiceProvider implements IEInvoiceProvider {
    async officialiseInvoice(invoice: IInvoice): Promise<{ ettn: string; status: string }> {
        logger.info('e-invoice.simulate_start', { invoiceId: invoice.id });

        // Simulate network delay
        await new Promise(r => setTimeout(r, 1500));

        // Generate mock ETTN (UUID format usually)
        const ettn = `GIB${new Date().getFullYear()}${Math.floor(Math.random() * 1000000000)}`;

        return {
            ettn,
            status: 'SENT_TO_GIB'
        };
    }
}
