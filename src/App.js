import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link
} from 'react-router-dom';import './App.css';

import Login from './pages/Login';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Mandi from './pages/Mandi';
import KisanBot from './pages/KisanBot';
import Profile from './pages/Profile';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [locationData, setLocationData] = useState('Detecting location...');
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn && !dataLoaded) {
      fetchAllData();
    }
  }, [isLoggedIn, dataLoaded]);

  const fetchAllData = async () => {
    try {
      const response = await fetch('https://fieldmind-backend.onrender.com/api/mandi');
      const data = await response.json();
      if (data.success) setMandiPrices(data.prices);
    } catch (err) {
      console.log('Mandi fetch failed');
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            const geoRes = await fetch(
              'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
              lat + '&lon=' + lon
            );
            const geoData = await geoRes.json();
            const city = geoData.address.city ||
              geoData.address.town ||
              geoData.address.village ||
              'Your Location';
            setLocationData(city + ', ' + (geoData.address.state || ''));
          } catch (err) {
            setLocationData('Hyderabad, Telangana');
          }

          try {
            const weatherRes = await fetch(
              'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
              '&longitude=' + lon +
              '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
              '&timezone=auto'
            );
            const weatherJson = await weatherRes.json();
            setWeatherData(weatherJson.current);
          } catch (err) {
            console.log('Weather failed');
          }
        },
        () => setLocationData('Hyderabad, Telangana')
      );
    }

    setDataLoaded(true);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/login');
  };

  const activePage = location.pathname.replace('/', '') || 'home';

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">

      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">FieldMind</div>
        <nav className="sidebar-nav">
          {[
            { path: 'home', label: 'Home' },
            { path: 'feed', label: 'Feed' },
            { path: 'mandi', label: 'Mandi' },
            { path: 'kisanbot', label: 'FieldMind AI' },
            { path: 'profile', label: 'Profile' },
          ].map(item => (
            <Link
  key={item.path}
  to={'/' + item.path}
  className={`sidebar-item ${activePage === item.path ? 'active' : ''}`}
>
  {item.label}
</Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* MOBILE TOP NAVBAR */}
        <div className="mobile-navbar">
          <span className="mobile-logo">FieldMind</span>
          <span onClick={() => navigate('/profile')}>Account</span>
        </div>

        {/* ROUTES */}
        <div className="page-content">
          <Routes>
            <Route
              path="/home"
              element={
                <Home
                  onNavigate={(page) => navigate('/' + page)}
                  mandiPrices={mandiPrices}
                  weatherData={weatherData}
                  locationData={locationData}
                />
              }
            />
            <Route path="/feed" element={<Feed />} />
            <Route
              path="/mandi"
              element={
                <Mandi
                  prices={mandiPrices}
                  onRefresh={fetchAllData}
                />
              }
            />
            <Route path="/kisanbot" element={<KisanBot />} />
            <Route
              path="/profile"
              element={<Profile onLogout={handleLogout} />}
            />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="mobile-bottom-nav">
          {[
            { path: 'home', label: 'Home' },
            { path: 'feed', label: 'Feed' },
            { path: 'mandi', label: 'Mandi' },
            { path: 'kisanbot', label: 'AI' },
            { path: 'profile', label: 'Me' },
          ].map(item => (
            <Link
  key={item.path}
  to={'/' + item.path}
  className={activePage === item.path ? 'active' : ''}
>
  {item.label}
  <span>{item.label}</span>
</Link>
          ))}
        </div>

      </main>
    </div>
  );
}

export default App;