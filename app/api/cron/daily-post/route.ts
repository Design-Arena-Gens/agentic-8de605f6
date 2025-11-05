import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { VideoGenerator } from '@/lib/videoGenerator';
import { VideoStorage } from '@/lib/videoStorage';
import { InstagramPoster } from '@/lib/instagramPoster';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pending posts that are due
    const pendingPosts = db.getPendingPosts();

    if (pendingPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending posts to process',
      });
    }

    const results = [];

    for (const post of pendingPosts) {
      try {
        db.updatePost(post.id, { status: 'processing' });

        // Generate video
        const videoGenerator = new VideoGenerator(process.env.FAL_API_KEY!);
        const videoResult = await videoGenerator.generateVideo({
          prompt: post.prompt,
        });

        // Save to storage
        const storage = new VideoStorage();
        const filename = `video_${post.id}_${Date.now()}.mp4`;
        const storedUrl = await storage.saveVideo(videoResult.videoUrl, filename);

        // Post to Instagram
        const poster = new InstagramPoster(
          process.env.INSTAGRAM_ACCESS_TOKEN!,
          process.env.INSTAGRAM_USER_ID!
        );
        const instagramResult = await poster.postVideo(storedUrl, post.caption);

        // Update post
        db.updatePost(post.id, {
          videoUrl: storedUrl,
          instagramPostId: instagramResult.id,
          status: 'completed',
        });

        results.push({
          postId: post.id,
          status: 'success',
          instagramPostId: instagramResult.id,
        });
      } catch (error: any) {
        console.error(`Error processing post ${post.id}:`, error);
        db.updatePost(post.id, {
          status: 'failed',
          error: error.message,
        });
        results.push({
          postId: post.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
