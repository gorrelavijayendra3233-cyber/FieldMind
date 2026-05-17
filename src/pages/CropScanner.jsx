import React, { useState, useRef } from 'react';
import './CropScanner.css';

function CropScanner({ onClose }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setImageBase64(event.target.result.split(',')[1]);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imageBase64) {
      setError('Please select a crop image first!');
      return;
    }
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch('https://fieldmind-backend.onrender.com/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageBase64: imageBase64 })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError('Could not analyze image. Please try again!');
        console.log('Scan error:', data.error);
      }

    } catch (err) {
      setError('Connection error. Please check internet and try again!');
      console.log('Fetch error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-sheet">

        {/* HEADER */}
        <div className="scanner-header">
          <div>
            <h2 className="scanner-title">Crop Scanner</h2>
            <p className="scanner-sub">AI powered disease detection</p>
          </div>
          <button className="scanner-close" onClick={onClose}>Close</button>
        </div>

        {/* IMAGE AREA */}
        <div
          className="image-area"
          onClick={() => fileRef.current.click()}
        >
          {image ? (
            <img src={image} alt="Crop" className="crop-preview" />
          ) : (
            <div className="image-placeholder">
              <p className="placeholder-icon"></p>
              <p className="placeholder-text">Tap to take photo or upload image</p>
              <p className="placeholder-sub">Supports JPG and PNG</p>
            </div>
          )}
        </div>

        {/* FILE INPUT */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* BUTTONS */}
        <div className="scanner-btns">
          <button
            className="scan-btn outline"
            onClick={() => fileRef.current.click()}
          >
            Upload Image
          </button>
          <button
            className="scan-btn solid"
            onClick={analyzeImage}
            disabled={!image || loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Crop'}
          </button>
        </div>

        {/* ERROR */}
        {error && <p className="scanner-error">{error}</p>}

        {/* LOADING */}
        {loading && (
          <div className="scanner-loading">
            <p>AI is analyzing your crop image...</p>
            <p>Please wait a moment</p>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="scanner-result">
            <p className="result-title">AI Analysis Result</p>
            <p className="result-text">{result}</p>
            <button
              className="scan-btn solid"
              style={{ marginTop: '12px' }}
              onClick={() => {
                setImage(null);
                setImageBase64(null);
                setResult(null);
              }}
            >
              Scan Another Crop
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CropScanner;