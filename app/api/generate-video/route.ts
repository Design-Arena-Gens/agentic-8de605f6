import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerator } from '@/lib/videoGenerator';
import { VideoStorage } from '@/lib/videoStorage';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, caption, scheduledTime } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const falApiKey = process.env.FAL_API_KEY;
    if (!falApiKey) {
      return NextResponse.json(
        { error: 'FAL_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Create scheduled post
    const post = db.createPost(
      prompt,
      caption || prompt,
      scheduledTime || new Date().toISOString()
    );

    // Generate video in background if no scheduled time or if time is now
    if (!scheduledTime || new Date(scheduledTime) <= new Date()) {
      // Start processing immediately
      processVideo(post.id, prompt, caption || prompt).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      postId: post.id,
      message: scheduledTime
        ? 'Video scheduled for generation and posting'
        : 'Video generation started',
    });
  } catch (error: any) {
    console.error('Error in generate-video:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function processVideo(postId: string, prompt: string, caption: string) {
  try {
    db.updatePost(postId, { status: 'processing' });

    // Generate video
    const videoGenerator = new VideoGenerator(process.env.FAL_API_KEY!);
    const result = await videoGenerator.generateVideo({ prompt });

    // Save to storage
    const storage = new VideoStorage();
    const filename = `video_${postId}_${Date.now()}.mp4`;
    const storedUrl = await storage.saveVideo(result.videoUrl, filename);

    // Update post with video URL
    db.updatePost(postId, {
      videoUrl: storedUrl,
      status: 'completed',
    });

    console.log(`Video generated and saved: ${storedUrl}`);
  } catch (error: any) {
    console.error(`Error processing video for post ${postId}:`, error);
    db.updatePost(postId, {
      status: 'failed',
      error: error.message,
    });
  }
}
