import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { logger } from "../../logger.js";

logger.info("scraper.stealth_plugin_register");
(puppeteer as any).use(StealthPlugin());

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    logger.info("scraper.browser_launch_start");
    try {
      // @ts-expect-error - Puppeteer types might mismatch with extra plugins
      browserInstance = (await puppeteer.launch({
        headless: false, // Gerçek tarayıcı modu - bot tespitini zorlaştırır
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled", // "navigator.webdriver" bayrağını gizle
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--start-maximized", // Tam ekran başlat
          "--window-size=1920,1080",
        ],
        defaultViewport: null, // Gerçek ekran boyutunu kullan
        ignoreDefaultArgs: ["--enable-automation"], // Automation flag'ini kaldır
      })) as unknown as Browser;
      logger.info("scraper.browser_launch_success");

      browserInstance.on("disconnected", () => {
        logger.warn("scraper.browser_disconnected");
        browserInstance = null;
      });
    } catch (e) {
      logger.error("scraper.browser_launch_failed", { err: e });
      throw e;
    }
  }
  return browserInstance;
}

export async function createPage(browser: Browser, options?: { aggressive?: boolean }): Promise<Page> {
  const page = await browser.newPage();
  const aggressive = options?.aggressive ?? false;
  
  // Rastgele gerçekçi User-Agent seç
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  ];
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUA);
  
  // Viewport ayarla (gerçekçi ekran boyutu)
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  
  // WebDriver özelliğini gizle ve diğer bot tespitlerini atla
  await page.evaluateOnNewDocument(() => {
    // Navigator.webdriver özelliğini undefined yap
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Chrome runtime'ı ekle (bot tespiti için)
    (window as any).chrome = {
      runtime: {},
    };
    
    // Permissions API'yi override et
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission } as PermissionStatus) :
        originalQuery(parameters)
    );
    
    // Plugin sayısını artır
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Dil ayarları
    Object.defineProperty(navigator, 'languages', {
      get: () => ['tr-TR', 'tr', 'en-US', 'en'],
    });
  });
  
  // Aggressive mode: Ekstra Cloudflare bypass önlemleri
  if (aggressive) {
    await page.evaluateOnNewDocument(() => {
      // Canvas fingerprint protection
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type?: string) {
        const context = this.getContext('2d');
        if (context) {
          // Canvas'a minimal noise ekle
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = imageData.data[i] ^ Math.floor(Math.random() * 2);
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, [type]);
      };

      // WebGL fingerprint protection
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // Vendor ve renderer bilgilerini randomize et
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };

      // Audio context fingerprint protection
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const originalCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function() {
          const oscillator = originalCreateOscillator.apply(this);
          const originalStart = oscillator.start;
          oscillator.start = function(when?: number) {
            // Minimal timing noise ekle
            const noise = Math.random() * 0.0001;
            return originalStart.apply(this, [when ? when + noise : noise]);
          };
          return oscillator;
        };
      }

      // Screen resolution randomization
      Object.defineProperty(screen, 'width', {
        get: () => 1920 + Math.floor(Math.random() * 100),
      });
      Object.defineProperty(screen, 'height', {
        get: () => 1080 + Math.floor(Math.random() * 100),
      });

      // Timezone randomization (Türkiye için)
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        value: function() {
          return {
            locale: 'tr-TR',
            timeZone: 'Europe/Istanbul',
            calendar: 'gregory',
            numberingSystem: 'latn',
          };
        },
      });
    });

    // Sayfa yüklendikten sonra mouse movement simülasyonu
    logger.info("scraper.aggressive_mode_enabled");
  }
  
  // Ekstra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
  });
  
  return page;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
