import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Profile.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
function Profile({ onLogout }) {  
    useEffect(() => {
  fetchUserPosts();
}, []);

const fetchUserPosts = async () => {
  try {
    const user = auth.currentUser;

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setUserPosts(posts);

  } catch (err) {
    console.log(err);
  }
};
    const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
const [userPosts, setUserPosts] = useState([]);
  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [cropType, setCropType] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
const [followingCount, setFollowingCount] = useState(0);

  // Load farmer data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
  const userRef = doc(db, 'users', auth.currentUser.uid);

  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();

    setFollowersCount(data.followers?.length || 0);
    setFollowingCount(data.following?.length || 0);
  }
};

fetchUserData();
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'farmers', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFarmerData(data);
            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setLocation(data.location || '');
            setCropType(data.cropType || '');
            setFarmSize(data.farmSize || '');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'farmers', user.uid), {
        fullName,
        phone,
        location,
        cropType,
        farmSize,
      });
      setFarmerData(prev => ({
        ...prev,
        fullName,
        phone,
        location,
        cropType,
        farmSize,
      }));
      setEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
    }
    setSaving(false);
  };

const handleLogout = async () => {
  await signOut(auth);
  if (onLogout) onLogout();
};
  if (loading) {
    return (
      <div className="profile-loading">
        Loading your profile...
      </div>
    );
  }

  return (
  <div className="profile-page">

    {/* TOP PROFILE SECTION */}
    <div className="insta-profile-top">

      <div className="insta-avatar">
        {farmerData?.fullName?.charAt(0).toUpperCase() || 'F'}
      </div>

      <div className="insta-profile-info">

        <div className="insta-top-row">
          <h2>{farmerData?.fullName || 'Farmer'}</h2>

          <button
            className="edit-btn small"
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editing
              ? 'Save'
              : 'Edit Profile'}
          </button>
        </div>

        <div className="insta-stats">

  <div>
    <strong>{userPosts.length}</strong>
    <span>Posts</span>
  </div>

  <div>
    <strong>{followersCount}</strong>
    <span>Followers</span>
  </div>

  <div>
    <strong>{followingCount}</strong>
    <span>Following</span>
  </div>

</div>

        <div className="insta-bio">
          
          <p className="bio-text">
            - {farmerData?.cropType || 'Farmer'}
          </p>

          <p className="bio-location">
            - {farmerData?.location || 'Location not set'}
          </p>

          <p className="bio-language">
            - {farmerData?.language || 'English'}
          </p>
        </div>

      </div>
    </div>

    {/* PROFILE DETAILS */}
    <div className="info-card">

      <div className="info-row">
        <p className="info-label">Phone</p>

        {editing ? (
          <input
            className="info-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        ) : (
          <p className="info-value">
            {farmerData?.phone || 'Not set'}
          </p>
        )}
      </div>

      <div className="info-row">
        <p className="info-label">Farm Size</p>

        {editing ? (
          <input
            className="info-input"
            value={farmSize}
            onChange={(e) => setFarmSize(e.target.value)}
          />
        ) : (
          <p className="info-value">
            {farmerData?.farmSize || 'N/A'}
          </p>
        )}
      </div>

      <div className="info-row">
        <p className="info-label">Email</p>

        <p className="info-value">
          {farmerData?.email || auth.currentUser?.email}
        </p>
      </div>

    </div>

    {/* FARM POSTS GRID */}
    <div className="posts-section">

  <div className="posts-header">
    <h3>Posts</h3>
  </div>

  {userPosts.length > 0 ? (

    <div className="posts-grid">

      {userPosts.map(post => (
        <div className="post-box" key={post.id}>

          <div className="profile-post-card">

  {post.image && (
    <img
      src={post.image}
      alt="post"
      className="profile-post-image"
    />
  )}

  {post.caption && (
    <div className="profile-post-caption">
      {post.caption}
    </div>
  )}

</div>

        </div>
      ))}

    </div>

  ) : (

    <div className="no-posts">
      <div className="no-posts-icon"></div>
      <h3>No Posts Yet</h3>
      <p>Your crop updates will appear here.</p>
    </div>

  )}

</div>

    {/* LOGOUT */}
    <button className="logout-btn" onClick={handleLogout}>
      Logout
    </button>

  </div>
);
}

export default Profile;