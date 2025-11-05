import axios from 'axios';
import FormData from 'form-data';

export interface InstagramPostResult {
  id: string;
  status: string;
}

export class InstagramPoster {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  async postVideo(videoUrl: string, caption: string): Promise<InstagramPostResult> {
    try {
      // Step 1: Create container
      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.userId}/media`,
        {
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption,
          share_to_feed: true,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      const containerId = containerResponse.data.id;
      console.log(`Container created: ${containerId}`);

      // Step 2: Poll for completion
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (!isReady && attempts < maxAttempts) {
        await this.sleep(5000);

        const statusResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${containerId}`,
          {
            params: {
              fields: 'status_code',
              access_token: this.accessToken,
            },
          }
        );

        const statusCode = statusResponse.data.status_code;

        if (statusCode === 'FINISHED') {
          isReady = true;
        } else if (statusCode === 'ERROR') {
          throw new Error('Instagram processing failed');
        }

        attempts++;
      }

      if (!isReady) {
        throw new Error('Instagram processing timed out');
      }

      // Step 3: Publish container
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.userId}/media_publish`,
        {
          creation_id: containerId,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      console.log(`Video published: ${publishResponse.data.id}`);

      return {
        id: publishResponse.data.id,
        status: 'published',
      };
    } catch (error: any) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      throw new Error(`Failed to post to Instagram: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
