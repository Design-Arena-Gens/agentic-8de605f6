import { put, list, del } from '@vercel/blob';
import axios from 'axios';

export class VideoStorage {
  async saveVideo(videoUrl: string, filename: string): Promise<string> {
    try {
      // Download video from URL
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });

      const videoBuffer = Buffer.from(response.data);

      // Upload to Vercel Blob Storage
      const blob = await put(filename, videoBuffer, {
        access: 'public',
        contentType: 'video/mp4',
      });

      console.log(`Video saved to blob storage: ${blob.url}`);
      return blob.url;
    } catch (error: any) {
      console.error('Error saving video:', error.message);
      throw new Error(`Failed to save video: ${error.message}`);
    }
  }

  async listVideos(): Promise<any[]> {
    try {
      const { blobs } = await list();
      return blobs;
    } catch (error: any) {
      console.error('Error listing videos:', error.message);
      throw new Error(`Failed to list videos: ${error.message}`);
    }
  }

  async deleteVideo(url: string): Promise<void> {
    try {
      await del(url);
      console.log(`Video deleted: ${url}`);
    } catch (error: any) {
      console.error('Error deleting video:', error.message);
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }
}
