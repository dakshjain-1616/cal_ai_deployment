import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, Loader, Search } from 'lucide-react';
import { analyzeFoodImage, logMeal, logMealFromImage, searchFood } from '../services/api';
import { useNavigate } from 'react-router-dom';

const FoodScanner = ({ profile }) => {
  const [mode, setMode] = useState(null); // 'camera', 'upload', 'search'
  const [imageData, setImageData] = useState(null); // DataURL for preview
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Always render video element but hide it
  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setMode('camera');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImageData(imageDataUrl);
      stopCamera();
      // Convert dataURL to Blob and send to backend
      const blob = dataURLtoBlob(imageDataUrl);
      const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
      analyzeImageFile(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      // For preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target.result);
        setMode('upload');
      };
      reader.readAsDataURL(file);
      // Send file to backend
      analyzeImageFile(file);
    } else {
      setError('No file selected.');
    }
  };

  // Send image file to backend for analysis
  const analyzeImageFile = async (file) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      if (!(file instanceof File || file instanceof Blob)) {
        setError('Invalid image file.');
        setAnalyzing(false);
        return;
      }
      const analysis = await logMealFromImage(file);
      // Defensive: check for required fields in response
      if (!analysis || (!analysis.food_name && !analysis.foods)) {
        setError('No food detected in image. Please try another photo.');
        setResult(null);
      } else {
        setResult(analysis);
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      let msg = 'Failed to analyze image. Please try again.';
      if (err?.response?.data?.detail) {
        msg += ' ' + err.response.data.detail;
      }
      setError(msg);
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // Utility: Convert dataURL to Blob
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setError(null);
    try {
      const results = await searchFood(searchQuery);
      setSearchResults(results);
      setMode('search');
    } catch (err) {
      console.error('Error searching food:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (food) => {
    setResult({
      food_name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving_size: food.serving
    });
    setSearchResults([]);
  };

  const saveMeal = async () => {
    // If result came from image analysis, meal is already saved by backend
    if (result && result.foods) {
      // Just show success and redirect
      setImageData(null);
      setResult(null);
      setMode(null);
      navigate('/');
      return;
    }
    // For search/manual entry, call logMeal
    try {
      await logMeal({
        food_name: result.food_name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        serving_size: result.serving_size,
        date: new Date().toDateString()
      });
      setImageData(null);
      setResult(null);
      setMode(null);
      navigate('/');
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('Failed to save meal. Please try again.');
    }
  };

  const reset = () => {
    setImageData(null);
    setResult(null);
    setMode(null);
    setError(null);
    setSearchQuery('');
    setSearchResults([]);
    stopCamera();
  };

  // Initial mode selection
  if (!mode && !result) {
    return (
      <div style={{ padding: '24px 16px', paddingBottom: '100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 className="heading-2" style={{ marginBottom: '8px' }}>Scan Your Food</h1>
          <p className="body-medium" style={{ marginBottom: '32px' }}>Choose how you want to track your meal</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={startCamera}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minHeight: '80px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Camera size={32} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Take Photo</p>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Use your camera to capture food</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minHeight: '80px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Upload size={32} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Upload Image</p>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Choose from your gallery</p>
              </div>
            </button>

            <button
              onClick={() => setMode('search')}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minHeight: '80px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Search size={32} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Search Database</p>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Find food in our database</p>
              </div>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  // Camera view
  if (isCameraActive) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'black',
        zIndex: 1000
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          padding: '0 24px'
        }}>
          <button
            onClick={stopCamera}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={28} color="white" />
          </button>
          
          <button
            onClick={captureImage}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'white',
              border: '4px solid rgba(255, 255, 255, 0.5)',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    );
  }

  // Always render hidden video element for camera functionality
  return (
    <>
      <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ padding: '24px 16px', paddingBottom: '100px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Search Mode */}
          {mode === 'search' && !result && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <X size={20} /> Back
                </button>
                <h2 className="heading-3" style={{ marginBottom: '16px' }}>Search Food Database</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for food..."
                    style={{ flex: 1 }}
                  />
                  <button onClick={handleSearch} className="btn-primary" disabled={searching}>
                    {searching ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {searchResults.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => selectSearchResult(food)}
                      className="service-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>{food.name}</p>
                          <p className="caption">{food.serving}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p className="body-medium" style={{ fontWeight: 600 }}>{food.calories} cal</p>
                          <p className="caption">{food.protein}g P | {food.carbs}g C | {food.fat}g F</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <div className="service-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Loader size={48} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--brand-primary)' }} />
              <h3 className="heading-4" style={{ marginBottom: '8px' }}>Analyzing your food...</h3>
              <p className="body-small">This may take a few seconds</p>
            </div>
          )}

          {/* Result display */}
          {result && !analyzing && (
            <>
              {imageData && (
                <div style={{ marginBottom: '24px' }}>
                  <img 
                    src={imageData} 
                    alt="Food" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '16px',
                      maxHeight: '300px',
                      objectFit: 'cover'
                    }} 
                  />
                </div>
              )}

              <div className="service-card" style={{ marginBottom: '24px', background: 'var(--gradient-hero)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <CheckCircle size={32} color="#10b981" />
                  <div>
                    <h3 className="heading-4">{result.food_name}</h3>
                    <p className="caption">{result.serving_size}</p>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="caption" style={{ marginBottom: '4px' }}>Calories</p>
                    <p className="heading-4" style={{ color: 'var(--brand-primary)' }}>{result.calories}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p className="caption" style={{ marginBottom: '4px' }}>Protein</p>
                    <p className="heading-4" style={{ color: '#3b82f6' }}>{result.protein}g</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p className="caption" style={{ marginBottom: '4px' }}>Carbs</p>
                    <p className="heading-4" style={{ color: '#f59e0b' }}>{result.carbs}g</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p className="caption" style={{ marginBottom: '4px' }}>Fat</p>
                    <p className="heading-4" style={{ color: '#ef4444' }}>{result.fat}g</p>
                  </div>
                </div>
              </div>

              {result.breakdown && result.breakdown.length > 0 && (
                <div className="service-card" style={{ marginBottom: '24px' }}>
                  <h4 className="heading-4" style={{ marginBottom: '16px' }}>Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.breakdown.map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '12px',
                          background: 'var(--bg-section)',
                          borderRadius: '8px'
                        }}
                      >
                        <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>{item.item}</p>
                        <p className="caption">{item.calories} cal | {item.protein}g P | {item.carbs}g C | {item.fat}g F</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>
                  Try Again
                </button>
                <button onClick={saveMeal} className="btn-primary" style={{ flex: 1 }}>
                  Save Meal
                </button>
              </div>
            </>
          )}

          {error && (
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FoodScanner;
