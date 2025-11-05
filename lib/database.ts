// Simple in-memory database for tracking scheduled posts and video history
// In production, use a real database like PostgreSQL or MongoDB

export interface ScheduledPost {
  id: string;
  prompt: string;
  caption: string;
  scheduledTime: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  instagramPostId?: string;
  createdAt: string;
  error?: string;
}

class Database {
  private posts: Map<string, ScheduledPost> = new Map();

  createPost(prompt: string, caption: string, scheduledTime: string): ScheduledPost {
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post: ScheduledPost = {
      id,
      prompt,
      caption,
      scheduledTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.posts.set(id, post);
    return post;
  }

  getPost(id: string): ScheduledPost | undefined {
    return this.posts.get(id);
  }

  updatePost(id: string, updates: Partial<ScheduledPost>): ScheduledPost | undefined {
    const post = this.posts.get(id);
    if (post) {
      const updated = { ...post, ...updates };
      this.posts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  getAllPosts(): ScheduledPost[] {
    return Array.from(this.posts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPendingPosts(): ScheduledPost[] {
    const now = new Date();
    return this.getAllPosts().filter(
      post => post.status === 'pending' && new Date(post.scheduledTime) <= now
    );
  }

  deletePost(id: string): boolean {
    return this.posts.delete(id);
  }
}

export const db = new Database();
