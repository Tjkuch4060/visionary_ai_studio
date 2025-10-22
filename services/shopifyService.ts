import { ImageData } from '../App';

export interface ShopifyProduct {
  id: number;
  title: string;
  images: ShopifyProductImage[];
}

export interface ShopifyProductImage {
  id: number;
  src: string;
}

export const fetchShopifyProducts = async (storeUrl: string): Promise<ShopifyProduct[]> => {
  let cleanUrl = storeUrl.trim().replace(/^https?:\/\//, '').split('/')[0];
  if (!cleanUrl.endsWith('.myshopify.com')) {
    if (!cleanUrl.includes('.')) {
        cleanUrl = `${cleanUrl}.myshopify.com`;
    } else {
        throw new Error("Please use your '.myshopify.com' URL.");
    }
  }

  const endpoint = `https://${cleanUrl}/products.json?limit=50`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Store not found at "${cleanUrl}". Please check the URL.`);
      }
      // Try to get a more detailed error from Shopify's response
      let errorDetails = `Shopify store returned status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.errors) {
            errorDetails = `Shopify API Error: ${JSON.stringify(errorData.errors)}`;
        }
      } catch (e) {
        // Response was not JSON, use the status text
        errorDetails = `Shopify store returned status: ${response.status} ${response.statusText}`;
      }
      throw new Error(`Failed to fetch products. ${errorDetails}`);
    }
    const data = await response.json();
    if (!data.products || data.products.length === 0) {
        throw new Error("No products found in this store, or the store may be password protected.");
    }
    return data.products;
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    if (error instanceof TypeError) { // Network error
        throw new Error("A network error occurred. Please check your internet connection, browser extensions (like ad-blockers), and any firewalls.");
    }
    // Rethrow custom or other errors
    throw error; 
  }
};


export const convertImageUrlsToImageData = (images: ShopifyProductImage[]): Promise<ImageData[]> => {
    const promises = images.map(async (image) => {
        try {
            // Using a public CORS proxy to fetch images from a different origin.
            // This is for demonstration; a production app would use a server-side proxy.
            const proxyUrl = `https://corsproxy.io/?`;
            // This proxy expects the raw URL, not an encoded one.
            const response = await fetch(proxyUrl + image.src);
            
            if (!response.ok) {
                let errorReason = `Status: ${response.status} ${response.statusText}`;
                 if (response.status === 429) {
                    errorReason = "Too Many Requests. The CORS proxy is rate-limited. Please wait a moment and try again.";
                }
                throw new Error(`Failed to fetch image via proxy. Reason: ${errorReason}`);
            }
            const blob = await response.blob();
            
            return new Promise<ImageData>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    const [header, base64] = dataUrl.split(',');
                    const mimeTypeMatch = header.match(/:(.*?);/);

                    if (base64 && mimeTypeMatch && mimeTypeMatch[1]) {
                        resolve({ base64, mimeType: mimeTypeMatch[1], dataUrl });
                    } else {
                        reject(new Error(`Could not parse image data for ${image.src}`));
                    }
                };
                reader.onerror = error => reject(error);
            });
        } catch (error) {
            console.error(`Error converting image URL ${image.src}:`, error);
            const imageName = image.src.split('/').pop()?.split('?')[0] || 'unknown image';

            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                 throw new Error(`A network error occurred fetching "${imageName}". The CORS proxy may be down or an ad-blocker could be interfering. Please try again.`);
            }
            
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(`Failed to process image "${imageName}": ${message}`);
        }
    });

    return Promise.all(promises);
};