import { NextRequest, NextResponse } from 'next/server';
import { InstagramPoster } from '@/lib/instagramPoster';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const post = db.getPost(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!post.videoUrl) {
      return NextResponse.json(
        { error: 'Video not ready yet' },
        { status: 400 }
      );
    }

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Instagram credentials not configured' },
        { status: 500 }
      );
    }

    // Post to Instagram
    const poster = new InstagramPoster(accessToken, userId);
    const result = await poster.postVideo(post.videoUrl, post.caption);

    // Update post status
    db.updatePost(postId, {
      instagramPostId: result.id,
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      instagramPostId: result.id,
      message: 'Posted to Instagram successfully',
    });
  } catch (error: any) {
    console.error('Error posting to Instagram:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
