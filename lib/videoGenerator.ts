import axios from 'axios';

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  status: string;
  requestId: string;
}

export class VideoGenerator {
  private apiKey: string;
  private baseUrl: string = 'https://fal.run/fal-ai/ltx-video';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    try {
      // Submit video generation request
      const response = await axios.post(
        this.baseUrl,
        {
          prompt: request.prompt,
          num_inference_steps: 30,
          guidance_scale: 3,
          num_frames: request.duration || 121,
          frame_rate: 25,
          aspect_ratio: request.aspectRatio || '16:9',
        },
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const requestId = response.data.request_id;

      // Poll for completion
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (!videoUrl && attempts < maxAttempts) {
        await this.sleep(5000); // Wait 5 seconds between checks

        const statusResponse = await axios.get(
          `${this.baseUrl}/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${this.apiKey}`,
            },
          }
        );

        if (statusResponse.data.status === 'COMPLETED') {
          videoUrl = statusResponse.data.video?.url;
          break;
        } else if (statusResponse.data.status === 'FAILED') {
          throw new Error('Video generation failed');
        }

        attempts++;
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out');
      }

      return {
        videoUrl,
        status: 'completed',
        requestId,
      };
    } catch (error: any) {
      console.error('Video generation error:', error.response?.data || error.message);
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
