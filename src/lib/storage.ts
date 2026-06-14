import { supabase } from "./supabase";

export async function uploadFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME || "photos";
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("Storage upload error:", err);
    return { success: false, error: err.message };
  }
}
