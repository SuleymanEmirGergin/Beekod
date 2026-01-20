
export class ImportError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 500, code: string = "IMPORT_ERROR") {
        super(message);
        this.name = "ImportError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

export class InvalidUrlError extends ImportError {
    constructor(message: string = "Invalid URL") {
        super(message, 400, "INVALID_URL");
    }
}

export class ScrapeFailedError extends ImportError {
    constructor(message: string = "Failed to scrape product") {
        super(message, 502, "SCRAPE_FAILED");
    }
}

export class MarketplaceBlockedError extends ImportError {
    constructor(message: string = "Access to marketplace blocked") {
        super(message, 503, "MARKETPLACE_BLOCKED");
    }
}

export class MappingError extends ImportError {
    constructor(message: string = "Mapping failed") {
        super(message, 422, "MAPPING_ERROR");
    }
}
