import { SearchAdapter, SearchResultItem } from "../types.js";
import { n11Service } from "../../marketplace/n11Service.js";
import { logger } from "../../../logger.js";

interface N11Attribute {
  attributeName?: string;
  attributeValue?: string;
}

interface N11Product {
  title?: string;
  description?: string;
  salePrice?: number;
  n11ProductId?: string;
  imageUrls?: string[];
  barcode?: string;
  quantity?: number;
  sellerNickname?: string;
  attributes?: N11Attribute[];
}

interface N11SoapProduct {
  title?: string;
  name?: string;
  price?: string;
  salePrice?: string;
  productUrl?: string;
  id?: string;
  imageUrl?: string;
  images?: string[];
}

interface N11QueryResult {
  content?: N11Product[];
  totalPages?: number;
}

interface N11SoapSearchResult {
  products?: N11SoapProduct[];
}

export class N11Adapter implements SearchAdapter {
  name = "N11" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      // N11 API kullanarak ürün ara
      logger.info("n11_adapter.search_start", { query });

      // API yapılandırılmış mı kontrol et
      if (!n11Service.isConfigured()) {
        logger.warn("n11_adapter.api_not_configured");
        return [];
      }

      // Pagination ile birden fazla sayfa çek
      const pageSize = 200; // Her sayfada 200 ürün
      const maxPages = 3; // Maksimum 3 sayfa (600 ürün)
      const allProducts: N11Product[] = [];

      for (let page = 0; page < maxPages; page++) {
        try {
          const result = await n11Service.queryProducts({
            page,
            size: pageSize,
          }) as N11QueryResult;

          if (!result || !result.content || result.content.length === 0) {
            // Boş sayfa, döngüyü kır
            break;
          }

          allProducts.push(...result.content);

          // Son sayfaya ulaştık mı?
          if (result.totalPages && page >= result.totalPages - 1) {
            break;
          }

          logger.info("n11_adapter.page_fetched", { 
            page, 
            pageSize, 
            fetchedCount: result.content.length,
            totalProducts: allProducts.length 
          });
        } catch (pageError) {
          logger.error("n11_adapter.page_fetch_failed", { page, error: pageError });
          // Bir sayfa başarısız olursa devam et
          continue;
        }
      }

      if (allProducts.length === 0) {
        logger.info("n11_adapter.no_results", { query });
        return [];
      }

      // Sonuçları SearchResultItem formatına dönüştür
      const items: SearchResultItem[] = allProducts
        .filter((product) => {
          // Query ile eşleşen ürünleri filtrele (client-side)
          const searchTerm = query.toLowerCase();
          const title = (product.title || "").toLowerCase();
          const description = (product.description || "").toLowerCase();
          
          return title.includes(searchTerm) || description.includes(searchTerm);
        })
        .map((product) => {
          const brand = product.attributes?.find((a) => a.attributeName === "Marka")?.attributeValue;

          return {
            marketplace: this.name,
            title: product.title || "",
            price: product.salePrice || 0,
            currency: "TRY",
            url: `https://www.n11.com/urun/${product.n11ProductId}`,
            imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : "",
            image: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : "",
            description: product.description,
            brand,
            barcode: product.barcode,
            stockCount: product.quantity || 0,
            inStock: (product.quantity || 0) > 0,
            seller: {
              name: product.sellerNickname || ""
            },
            attributes: {},
            variants: []
          };
        })
        .slice(0, 10); // İlk 10 sonuç

      logger.info("n11_adapter.search_success", { 
        query, 
        totalFetched: allProducts.length,
        filteredResults: items.length 
      });

      // Eğer REST API'den sonuç bulunamadıysa, SOAP SearchCatalog dene
      if (items.length === 0) {
        logger.info("n11_adapter.trying_soap_search", { query });
        
        try {
          const soapResult = await n11Service.searchCatalog({
            title: query
          }) as N11SoapSearchResult;

          if (soapResult && soapResult.products && soapResult.products.length > 0) {
            const soapItems: SearchResultItem[] = soapResult.products
              .map((product) => ({
                marketplace: this.name,
                title: product.title || product.name || "",
                price: parseFloat(product.price || product.salePrice || "0"),
                currency: "TRY",
                url: product.productUrl || `https://www.n11.com/urun/${product.id}`,
                imageUrl: product.imageUrl || (product.images && product.images[0]) || "",
                image: product.imageUrl || (product.images && product.images[0]) || "",
                attributes: {},
                variants: []
              }))
              .slice(0, 10);

            logger.info("n11_adapter.soap_search_success", { 
              query, 
              soapResults: soapItems.length 
            });

            return soapItems;
          }
        } catch (soapError) {
          logger.error("n11_adapter.soap_search_failed", { query, error: soapError });
          // SOAP başarısız olursa boş array döndür
        }
      }

      return items;
    } catch (error) {
      logger.error(`n11_adapter.search_failed`, { query, error });
      return [];
    }
  }
}
