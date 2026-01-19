
import { syncPriceStock } from "../../marketplace/syncService.js";
import { logger } from "../../../logger.js";

/**
 * @deprecated Use syncWorker or enqueueSyncJob instead.
 */
export async function updateBulkPrice(barcode: string, price: number, marketplaces: string[] = []) {
    logger.warn("deprecated.updateBulkPrice", { msg: "Use enqueueSyncJob instead" });
    return syncPriceStock({
        barcode,
        price,
        targets: marketplaces.length > 0 ? marketplaces as any : ["all"]
    });
}
