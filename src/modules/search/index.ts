/**
 * Search Module Barrel Export
 * @module modules/search
 */

// Services
export * from "../../services/search/searchService.js";
export * from "../../services/semanticSearchService.js";
export * from "../../services/search/searchAggregator.js";

// Routes
export { searchRouter } from "../../routes/searchRoutes.js";

