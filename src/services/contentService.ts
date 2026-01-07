import { initData } from "./content/store.js";

export * from "./content/types.js";
export * from "./content/seo.js";
export * from "./content/social.js";
export * from "./content/translation.js";

// Initialize data on module load to match previous behavior
initData();
