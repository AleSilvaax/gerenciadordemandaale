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
  try {
    // Extract path from both public URLs and signed URLs
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(public|sign)\/([^/]+)\/(.+)$/);
    
    if (pathMatch) {
      return pathMatch[3]; // Return the file path part
    }
    
    // Fallback for direct file paths
    if (url.includes('/service-photos/')) {
      return url.split('/service-photos/')[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
};

/**
 * Convert existing photo URLs to signed URLs for private buckets
 */
export const convertToSignedUrl = async (photoUrl: string): Promise<string> => {
  // If already a signed URL, return as is
  if (photoUrl.includes('token=')) {
    return photoUrl;
  }

  const filePath = extractFilePathFromUrl(photoUrl);
  if (!filePath) {
    console.warn('Could not extract file path from URL:', photoUrl);
    return photoUrl;
  }

  const signedUrl = await generateSignedUrl('service-photos', filePath);
  return signedUrl || photoUrl;
};