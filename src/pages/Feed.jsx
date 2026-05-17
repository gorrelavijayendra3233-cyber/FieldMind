import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc
} from 'firebase/firestore';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [comment, setComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const fileRef = useRef(null);
const [cropTag, setCropTag] = useState('');
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const postList = await Promise.all(
  snapshot.docs.map(async (postDoc) => {

    const postData = postDoc.data();

    const userRef = doc(db, 'users', postData.userId);
    const userSnap = await getDoc(userRef);

    const userData = userSnap.exists()
      ? userSnap.data()
      : {};

    return {
      id: postDoc.id,
      ...postData,
      followers: userData.followers || [],
      following: userData.following || []
    };
  })
);
      setPosts(postList);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
    setLoading(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setImage(reader.result);
      const base64 = reader.result.split(',')[1];
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64) => {
    setAnalyzing(true);
    try {
      const response = await fetch('https://fieldmind-backend.onrender.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data.result);
      }
    } catch (err) {
      console.log('AI analysis failed');
    }
    setAnalyzing(false);
  };

  const handlePost = async () => {
    if (!caption && !image) return;
    setPosting(true);

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: user.email.split('@')[0],
        userEmail: user.email,
        caption,
        cropTag,
        image: image || '',
        aiAnalysis: aiAnalysis || '',
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      });

      setCaption('');
      setCropTag('');
      setImage(null);
      setAiAnalysis('');
      setShowCreatePost(false);
      await fetchPosts();

    } catch (err) {
      console.error('Error posting:', err);
    }
    setPosting(false);
  };

  const handleLike = async (postId, likes) => {
    const user = auth.currentUser;
    const postRef = doc(db, 'posts', postId);
    const alreadyLiked = likes.includes(user.uid);

    await updateDoc(postRef, {
      likes: alreadyLiked
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid)
    });

    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        likes: alreadyLiked
          ? p.likes.filter(id => id !== user.uid)
          : [...p.likes, user.uid]
      } : p
    ));
  };

  const handleComment = async (postId) => {
    const text = comment[postId];
    if (!text || !text.trim()) return;

    const user = auth.currentUser;
    const postRef = doc(db, 'posts', postId);

    const newComment = {
      userId: user.uid,
      userName: user.email.split('@')[0],
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });

    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        comments: [...(p.comments || []), newComment]
      } : p
    ));

    setComment(prev => ({ ...prev, [postId]: '' }));
  };
const getTimeAgo = (date) => {
  const seconds = Math.floor(
    (new Date() - new Date(date)) / 1000
  );

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const key in intervals) {
    const value = Math.floor(seconds / intervals[key]);

    if (value >= 1) {
      return `${value}${key.charAt(0)} ago`;
    }
  }

  return 'Just now';
};
const handleFollow = async (targetUserId) => {
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid === targetUserId) return;

  const currentUserRef = doc(db, 'users', currentUser.uid);
  const targetUserRef = doc(db, 'users', targetUserId);

  const currentUserSnap = await getDoc(currentUserRef);

  const currentData = currentUserSnap.exists()
    ? currentUserSnap.data()
    : {};

  const following = currentData.following || [];

  const alreadyFollowing = following.includes(targetUserId);

  if (alreadyFollowing) {

    await setDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    }, { merge: true });

    await setDoc(targetUserRef, {
      followers: arrayRemove(currentUser.uid)
    }, { merge: true });

  } else {

    await setDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    }, { merge: true });

    await setDoc(targetUserRef, {
      followers: arrayUnion(currentUser.uid)
    }, { merge: true });

  }

  fetchPosts();
};
  return (
    <div className="feed-page">

      {/* CREATE POST BAR */}
      <div className="create-post" onClick={() => setShowCreatePost(true)}>
        <div className="create-avatar">
          {auth.currentUser?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="create-input-fake">
          Share your crop update...
        </div>
        <button className="create-btn">Post</button>
      </div>

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Create Post</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreatePost(false)}
              >
                Close
              </button>
            </div>

            {/* IMAGE UPLOAD */}
            <div
              className="image-upload-area"
              onClick={() => fileRef.current.click()}
            >
              {image ? (
                <img src={image} alt="Selected" className="upload-preview" />
              ) : (
                <div className="upload-placeholder">
                  <p className="upload-icon"></p>
                  <p>Tap to upload crop photo</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {/* AI ANALYSIS */}
            {analyzing && (
              <div className="ai-analyzing">
                AI is analyzing your crop image...
              </div>
            )}

            {aiAnalysis && (
              <div className="ai-result-preview">
                <p className="ai-result-label">AI Analysis Result</p>
                <p className="ai-result-text">
                  {aiAnalysis.slice(0, 200)}...
                </p>
              </div>
            )}

            {/* CAPTION */}
            <textarea
              className="caption-input"
              placeholder="Write about your crop in Telugu, Hindi or English..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
            />
            <input
  type="text"
  placeholder="Crop tag (Example: Chilli, Rice, Cotton)"
  className="caption-input"
  value={cropTag}
  onChange={(e) => setCropTag(e.target.value)}
/>

            <button
              className="post-submit-btn"
              onClick={handlePost}
              disabled={posting || (!caption && !image)}
            >
              {posting ? 'Posting...' : 'Share Post'}
            </button>

          </div>
        </div>
      )}

      {/* POSTS LIST */}
      {loading ? (
        <div className="feed-loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          No posts yet. Be the first to share your crop update!
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-card">

            {/* Header */}
            <div className="post-header">
              <div className="post-avatar">
                {post.userName?.charAt(0).toUpperCase()}
              </div>
              <div className="post-meta">
                <p className="post-name">{post.userName}</p>
                <p className="post-location">
                  {getTimeAgo(post.createdAt)}
                </p>
              </div>
<button
  className={`follow-btn ${
    post.followers?.includes(auth.currentUser?.uid)
      ? 'following'
      : ''
  }`}
  onClick={() => handleFollow(post.userId)}
>
  {post.followers?.includes(auth.currentUser?.uid)
    ? 'Following'
    : 'Follow'}
</button>            </div>

            {/* Image */}
            {post.image && (
              <div className="post-image" style={{ position: 'relative' }}>
                <img
                  src={post.image}
                  alt="Crop"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
                {post.aiAnalysis && (
                  <div className="ai-tag">
                    AI: {post.aiAnalysis.slice(0, 60)}...
                  </div>
                )}
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="post-caption">
                <p>{post.caption}</p>
              </div>
            )}
            {post.cropTag && (
  <div className="crop-tags">
    <span>#{post.cropTag}</span>
  </div>
)}

            {/* Actions */}
            <div className="post-actions">
              <button
                className={`action-pill ${post.likes?.includes(auth.currentUser?.uid) ? 'liked' : ''}`}
                onClick={() => handleLike(post.id, post.likes || [])}
              >
                {post.likes?.includes(auth.currentUser?.uid) ? 'Liked' : 'Like'} {post.likes?.length || 0}
              </button>
              <button
                className="action-pill"
                onClick={() => setShowComments(prev => ({
                  ...prev,
                  [post.id]: !prev[post.id]
                }))}
              >
                Comment {post.comments?.length || 0}
              </button>
              <button className="action-pill">Share</button>
            </div>

            {/* Comments */}
            {showComments[post.id] && (
              <div className="comments-section">
                {post.comments?.length > 0 && (
                  post.comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <span className="comment-user">{c.userName}</span>
                      <span className="comment-text"> {c.text}</span>
                    </div>
                  ))
                )}
                <div className="comment-input-row">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="comment-input"
                    value={comment[post.id] || ''}
                    onChange={e => setComment(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                    onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                  />
                  <button
                    className="comment-send"
                    onClick={() => handleComment(post.id)}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

          </div>
        ))
      )}

    </div>
  );
}

export default Feed;