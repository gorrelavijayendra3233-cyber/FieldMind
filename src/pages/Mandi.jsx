import React, { useState, useEffect } from 'react';
import './Mandi.css';

function Mandi() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/mandi');
      const data = await response.json();

      if (data.success && data.prices.length > 0) {
        setPrices(data.prices);
        setLastUpdated(new Date().toLocaleTimeString('en-IN'));
      } else {
        setError('No latest prices available right now. Try again later!');
      }
    } catch (err) {
      setError('Could not connect to server. Make sure backend is running!');
    }
    setLoading(false);
  };

  return (
    <div className="mandi-page">

      <div className="mandi-banner">
        <div className="mandi-banner-top">
          <p className="mandi-banner-label">Nearest Mandi</p>
          <p className="mandi-banner-name">Telangana APMC Mandi</p>
          <p className="mandi-banner-dist">Live prices updated daily</p>
        </div>
        <div className="mandi-banner-btns">
          <button className="banner-btn solid">Directions</button>
          <button className="banner-btn outline">Call</button>
        </div>
      </div>

      <div className="prices-header">
        <p className="prices-title">
          Latest Prices — {new Date().toLocaleDateString('en-IN')}
        </p>
        <button className="refresh-btn" onClick={fetchPrices}>
          Refresh
        </button>
      </div>

      {lastUpdated && (
        <p className="last-updated">Last updated: {lastUpdated}</p>
      )}

      {loading && (
        <div className="prices-loading">
          Fetching latest prices from market data...
        </div>
      )}

      {!loading && error && (
        <div className="mandi-error">{error}</div>
      )}

      {!loading && !error && prices.length > 0 && (
        <div className="prices-list">
          {prices.map((item, index) => (
            <div key={index} className="crop-row">
              <div className="crop-info">
                <p className="crop-name">{item.name}</p>
                <p className="crop-hindi">{item.market}</p>
                <p className="crop-prev">
                  Yesterday: Rs. {item.prevPrice}
                </p>
                <p className="crop-market">
                  {item.district} · {item.date}
                </p>
              </div>
              <div className="crop-price-info">
                <p className="crop-price">Rs. {item.price}</p>
                <p className={`crop-change ${item.up ? 'up' : 'down'}`}>
                  {item.up ? 'Up' : 'Down'} {item.change > 0 ? '+' : ''}{item.change}
                </p>
                <p style={{
                  fontSize: '0.65rem',
                  color: '#6b7c6b',
                  fontWeight: 600,
                  marginTop: 2
                }}>
                  Min: {item.minPrice} — Max: {item.maxPrice}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ai-prediction">
        <p className="ai-title">FieldMind AI Price Prediction</p>
        <p className="ai-text">
          Prices are fetched live from government mandi data.
          Compare prices across markets before selling your crop
          for maximum profit. Check multiple mandis for best rates.
        </p>
      </div>

    </div>
  );
}

export default Mandi;