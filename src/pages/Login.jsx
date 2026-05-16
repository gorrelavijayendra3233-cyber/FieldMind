import React, { useState } from 'react';
import { auth, db } from '../firebase/config';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

import './Login.css';

const googleProvider = new GoogleAuthProvider();

function Login({ onLogin }) {

  const [isSignup, setIsSignup] = useState(false);

  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState('');

  /* LOGIN STATES */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* SIGNUP STATES */
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  /* LOGIN */
  const handleLogin = async () => {

    if (!email || !password) {
      setError('Please fill all fields!');
      return;
    }

    setLoading(true);
    setError('');

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      onLogin();

    } catch (err) {

      if (err.code === 'auth/user-not-found') {
        setError('Account not found!');
      }

      else if (err.code === 'auth/wrong-password') {
        setError('Wrong password!');
      }

      else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password!');
      }

      else {
        setError('Something went wrong!');
      }

    }

    setLoading(false);

  };

  /* SIGNUP */
  const handleSignup = async () => {

    if (
      !fullName ||
      !phone ||
      !location ||
      !signupEmail ||
      !signupPassword
    ) {
      setError('Please fill all fields!');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    setError('');

    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          signupEmail,
          signupPassword
        );

      /* SAVE USER DATA */
      await setDoc(
        doc(db, 'farmers', result.user.uid),
        {
          fullName,
          phone,
          location,
          email: signupEmail,
          createdAt: new Date().toISOString(),
          loginMethod: 'email'
        }
      );

      onLogin();

    } catch (err) {

      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered!');
      }

      else {
        setError(err.message);
      }

    }

    setLoading(false);

  };

  /* GOOGLE LOGIN */
  const handleGoogleLogin = async () => {

    setGoogleLoading(true);
    setError('');

    try {

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      const user = result.user;

      const docRef = doc(db, 'farmers', user.uid);

      const docSnap = await getDoc(docRef);

      /* NEW USER */
      if (!docSnap.exists()) {

        await setDoc(docRef, {
          fullName: user.displayName || 'Farmer',
          email: user.email,
          phone: user.phoneNumber || '',
          location: '',
          createdAt: new Date().toISOString(),
          loginMethod: 'google'
        });

      }

      onLogin();

    } catch (err) {

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google login cancelled!');
      }

      else {
        setError('Google login failed!');
      }

    }

    setGoogleLoading(false);

  };

  /* FORGOT PASSWORD */
  const handleForgotPassword = async () => {

    if (!email) {
      setError('Please enter your email first!');
      return;
    }

    try {

      await sendPasswordResetEmail(auth, email);

      alert(
        'Password reset email sent! Check your inbox.'
      );

    } catch (err) {

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email!');
      }

      else {
        setError('Failed to send reset email!');
      }

    }

  };

  return (

    <div className="login-page">

      <div className="login-card">

        {/* LOGO */}
        <div className="login-icon">
          🌾
        </div>

        <h1>FieldMind</h1>

        <p className="login-hindi">
          Where Fields Meet Intelligence
        </p>

        {/* TOGGLE */}
        <div className="login-toggle">

          <button
            className={`toggle-btn ${!isSignup ? 'active' : ''}`}
            onClick={() => {
              setIsSignup(false);
              setError('');
            }}
          >
            Login
          </button>

          <button
            className={`toggle-btn ${isSignup ? 'active' : ''}`}
            onClick={() => {
              setIsSignup(true);
              setError('');
            }}
          >
            Sign Up
          </button>

        </div>

        {/* GOOGLE LOGIN */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >

          <div className="google-icon">

            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />

          </div>

          {
            googleLoading
              ? 'Connecting...'
              : 'Continue with Google'
          }

        </button>

        {/* DIVIDER */}
        <div className="divider">

          <div className="divider-line"></div>

          <p className="divider-text">
            or
          </p>

          <div className="divider-line"></div>

        </div>

        {/* LOGIN FORM */}
        {!isSignup && (

          <>

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="login-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="login-input"
              onKeyDown={(e) =>
                e.key === 'Enter' && handleLogin()
              }
            />

            <p
              className="forgot-password"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </p>

            {
              error &&
              <p className="login-error">
                {error}
              </p>
            }

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >

              {
                loading
                  ? 'Please wait...'
                  : 'Login to FieldMind'
              }

            </button>

          </>

        )}

        {/* SIGNUP FORM */}
        {isSignup && (

          <>

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              className="login-input"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              className="login-input"
            />

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              className="login-input"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={signupEmail}
              onChange={(e) =>
                setSignupEmail(e.target.value)
              }
              className="login-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) =>
                setSignupPassword(e.target.value)
              }
              className="login-input"
            />

            {
              error &&
              <p className="login-error">
                {error}
              </p>
            }

            <button
              className="login-btn"
              onClick={handleSignup}
              disabled={loading}
            >

              {
                loading
                  ? 'Creating Account...'
                  : 'Create Account'
              }

            </button>

          </>

        )}

      </div>

    </div>

  );

}

export default Login;