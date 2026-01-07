import { Locale } from "../../types.js";

export type Intent =
  | "price.set"
  | "price.increase"
  | "price.decrease"
  | "stock.set"
  | "stock.increase"
  | "stock.decrease"
  | "product.add"
  | "marketplace.add"
  | "marketplace.activate"
  | "marketplace.deactivate"
  | "marketplace.list"
  | "marketplace.price.set"
  | "marketplace.stock.set"
  | "marketplace.price.increase"
  | "marketplace.price.decrease"
  | "marketplace.stock.increase"
  | "marketplace.stock.decrease"
  | "marketplace.sync"
  | "marketplace.configured.list"
  | "marketplace.batch.result"
  | "marketplace.bulk"
  | "cargo.list"
  | "competitor.list"
  | "content.seo"
  | "content.social"
  | "content.translate.en"
  | "content.translate.tr"
  | "image.process"
  | "image.inspect"
  | "image.search"
  | "visual.search"
  | "web.search"
  | "pricing.recommend"
  | "report.sales"
  | "report.top_products"
  | "report.advice"
  | "cache.reset"
  | "sync.confirm"
  | "product.info"
  | "help"
  | "batch.price.update"
  | "batch.stock.update"
  | "stock.alert.list"
  | "network.stock.query"
  | "search.product"
  | "search"
  | "unknown";

export type ParsedMessage = {
  intent: Intent;
  barcode?: string;
  amount?: number;
  percent?: number;
  text?: string;
  query?: string;
  productName?: string;
  title?: string;
  price?: number;
  stock?: number;
  currency?: string;
  marketplace?: string;
  status?: "active" | "inactive";
  bulk?: boolean;
  category?: string;
  tone?: string;
  period?: "this_month" | "last_month" | "this_week" | "last_week";
  profile?: string;
  searchQuery?: string;
  searchLimit?: number;
  batchRequestId?: string;
  locale: Locale;
  missing: string[];
};
