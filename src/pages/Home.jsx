import React, { useState } from 'react';
import './Home.css';
import CropScanner from './CropScanner';
import { useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

function Home({ onNavigate, mandiPrices, weatherData, locationData }) {
  const [showScanner, setShowScanner] = useState(false);
const [farmerName, setFarmerName] = useState('Farmer');

useEffect(() => {
  const loadFarmerName = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, 'farmers', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFarmerName(
            data.fullName ||
            user.displayName ||
            user.email?.split('@')[0] ||
            'Farmer'
          );
        } else {
          setFarmerName(
            user.displayName ||
            user.email?.split('@')[0] ||
            'Farmer'
          );
        }
      }
    } catch (err) {
      console.log('Error loading name:', err);
    }
  };
  loadFarmerName();
}, []);
  const getWeatherCondition = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 69) return 'Rain';
    if (code <= 99) return 'Thunderstorm';
    return 'Clear';
  };

  const getWeatherAlert = (code) => {
    if (code >= 80) return 'Heavy rain expected — protect your crops!';
    if (code >= 60) return 'Rain expected — check drainage!';
    if (code >= 20) return 'Rainfall possible — plan irrigation accordingly';
    return 'Weather is favorable for farming today';
  };

  const temp = weatherData ? Math.round(weatherData.temperature_2m) : '--';
  const humidity = weatherData ? weatherData.relative_humidity_2m : '--';
  const condition = weatherData
    ? getWeatherCondition(weatherData.weather_code)
    : 'Loading...';
  const alert = weatherData
    ? getWeatherAlert(weatherData.weather_code)
    : '';

  return (
    <div className="home-page">
      <div className="greeting-header">

      <div>
        <p className="greeting-sub">
          🌾 Welcome Back
        </p>

        <h1 className="greeting-name">
  {farmerName}
</h1>
      </div>

      

    </div>

      {/* WEATHER SECTION */}
      <div className="weather-card">
        <div className="weather-left">
          <p className="weather-location">
            {locationData.toUpperCase()}
          </p>
          <p className="weather-condition">{condition}</p>
          {alert && <p className="weather-alert">{alert}</p>}
        </div>
        <div className="weather-right">
          <p className="weather-temp">{temp}°C</p>
          <p className="weather-humidity">Humidity: {humidity}%</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        <div
          className="action-btn"
          onClick={() => onNavigate('kisanbot')}
        >
          <div className="action-icon">AI</div>
          <div className="action-label">FieldMind AI</div>
        </div>
        <div
          className="action-btn"
          onClick={() => setShowScanner(true)}
        >
          <div className="action-icon">Scan</div>
          <div className="action-label">Scan Crop</div>
        </div>
        <div
          className="action-btn"
          onClick={() => onNavigate('mandi')}
        >
          <div className="action-icon">Price</div>
          <div className="action-label">Mandi Price</div>
        </div>
        <div
          className="action-btn"
          onClick={() => onNavigate('mandi')}
        >
          <div className="action-icon">Map</div>
          <div className="action-label">Find Mandi</div>
        </div>
      </div>

      {/* MANDI PRICES */}
      <div className="section-title">Today's Mandi Prices</div>
      <div className="mandi-list">
        {mandiPrices && mandiPrices.length > 0 ? (
          mandiPrices.slice(0, 4).map((item, index) => (
            <div key={index} className="mandi-card">
              <p className="mandi-name">{item.name}</p>
              <p className="mandi-price">Rs. {item.price}</p>
              <p className={`mandi-change ${item.up ? 'up' : 'down'}`}>
                {item.up ? '+' : ''}{item.change} today
              </p>
            </div>
          ))
        ) : (
          <>
            <div className="mandi-card">
              <p className="mandi-name">Rice</p>
              <p className="mandi-price">Rs. 2,180</p>
              <p className="mandi-change up">+45 today</p>
            </div>
            <div className="mandi-card">
              <p className="mandi-name">Chilli</p>
              <p className="mandi-price">Rs. 8,500</p>
              <p className="mandi-change up">+200 today</p>
            </div>
            <div className="mandi-card">
              <p className="mandi-name">Onion</p>
              <p className="mandi-price">Rs. 1,200</p>
              <p className="mandi-change down">-80 today</p>
            </div>
            <div className="mandi-card">
              <p className="mandi-name">Cotton</p>
              <p className="mandi-price">Rs. 6,800</p>
              <p className="mandi-change up">+120 today</p>
            </div>
          </>
        )}
      </div>

      {/* KISANBOT INPUT */}
      

      {/* CROP SCANNER */}
      {showScanner && (
        <CropScanner onClose={() => setShowScanner(false)} />
      )}

    </div>
  );
}

export default Home;