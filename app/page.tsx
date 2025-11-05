'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { data, mutate } = useSWR('/api/posts', fetcher, {
    refreshInterval: 5000,
  });

  const handleGenerateVideo = async () => {
    if (!prompt) {
      setMessage('Please enter a prompt');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          caption: caption || prompt,
          scheduledTime: scheduledTime || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setPrompt('');
        setCaption('');
        setScheduledTime('');
        mutate();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostToInstagram = async (postId: string) => {
    try {
      const response = await fetch('/api/post-to-instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Posted to Instagram: ${result.instagramPostId}`);
        mutate();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Post deleted');
        mutate();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            color: 'white',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎬 AI Video Agent
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
            Generate AI videos and schedule Instagram posts automatically
          </p>
        </header>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Create New Video</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Video Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A serene sunset over a mountain landscape with golden clouds"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '16px',
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Instagram Caption (Optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption for your Instagram post"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '16px',
                minHeight: '80px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Schedule Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Processing...' : 'Generate Video'}
          </button>

          {message && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '8px',
              background: message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('Error') ? '#c33' : '#363',
              border: `2px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`
            }}>
              {message}
            </div>
          )}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Video Queue & History</h2>

          {data?.posts?.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {data.posts.map((post: any) => (
                <div
                  key={post.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    background: '#fafafa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        background:
                          post.status === 'completed' ? '#4caf50' :
                          post.status === 'processing' ? '#ff9800' :
                          post.status === 'failed' ? '#f44336' : '#2196f3',
                        color: 'white'
                      }}>
                        {post.status.toUpperCase()}
                      </div>
                      <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Prompt:</strong> {post.prompt}
                      </p>
                      {post.caption && (
                        <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                          <strong>Caption:</strong> {post.caption}
                        </p>
                      )}
                      {post.scheduledTime && (
                        <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>
                          <strong>Scheduled:</strong> {new Date(post.scheduledTime).toLocaleString()}
                        </p>
                      )}
                      {post.videoUrl && (
                        <p style={{ margin: '8px 0', fontSize: '14px' }}>
                          <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                            📹 View Video
                          </a>
                        </p>
                      )}
                      {post.instagramPostId && (
                        <p style={{ margin: '8px 0', color: '#4caf50', fontSize: '14px' }}>
                          ✅ Posted to Instagram: {post.instagramPostId}
                        </p>
                      )}
                      {post.error && (
                        <p style={{ margin: '8px 0', color: '#f44336', fontSize: '14px' }}>
                          ❌ Error: {post.error}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {post.status === 'completed' && post.videoUrl && !post.instagramPostId && (
                        <button
                          onClick={() => handlePostToInstagram(post.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#E1306C',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Post to IG
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#f44336',
                          color: 'white',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
              No videos yet. Create your first one above!
            </p>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '15px',
          padding: '20px',
          marginTop: '30px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px' }}>📝 Setup Instructions</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Get a FAL.AI API key from <a href="https://fal.ai" style={{ color: '#fff', textDecoration: 'underline' }}>fal.ai</a></li>
            <li>Get Instagram Graph API credentials (Access Token & User ID)</li>
            <li>Add environment variables to Vercel project settings</li>
            <li>Set up a cron job to call <code>/api/cron/daily-post</code> daily</li>
          </ol>
          <p style={{ marginTop: '15px', fontSize: '14px', opacity: 0.9 }}>
            💡 The cron job will automatically process pending scheduled videos and post them to Instagram
          </p>
        </div>
      </div>
    </div>
  );
}
