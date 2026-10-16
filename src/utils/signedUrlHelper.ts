import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to generate signed URLs for private storage buckets
 * Since service-photos bucket is now private for security
 */
export const generateSignedUrl = async (
  bucketName: string, 
  filePath: string, 
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Helper to extract file path from existing photo URLs
 * This is needed when converting from public URLs to signed URLs
 */
export const extractFilePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  // Already a plain storage path (e.g. "serviceId/file.jpg")
  if (!/^https?:\/\//i.test(url)) {
    return decodeURIComponent(url.split('?')[0].replace(/^service-photos\//, ''));
  }
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (pathMatch) return decodeURIComponent(pathMatch[2]);
    if (urlObj.pathname.includes('/service-photos/')) {
      return decodeURIComponent(urlObj.pathname.split('/service-photos/')[1]);
    }
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
};

/**
 * Always generate a FRESH signed URL. Stored signed URLs expire (1h),
 * so reusing them breaks photos on other devices / later sessions.
 */
export const convertToSignedUrl = async (photoUrl: string, expiresIn = 3600): Promise<string> => {
  const filePath = extractFilePathFromUrl(photoUrl);
  if (!filePath) {
    console.warn('Could not extract file path from URL:', photoUrl);
    return photoUrl;
  }
  const signedUrl = await generateSignedUrl('service-photos', filePath, expiresIn);
  return signedUrl || photoUrl;
};