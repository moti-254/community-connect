import React, { useState } from 'react';
import { useAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReportForm = () => {
  const { api } = useAPI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    priority: 'Medium',
    location: {
      address: '',
      coordinates: {
        longitude: 0,
        latitude: 0
      }
    }
  });

  const categories = [
    'Infrastructure',
    'Sanitation', 
    'Parks & Recreation',
    'Safety',
    'Other'
  ];

  const priorities = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          address: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setMessage('');
    
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Location detected:', { latitude, longitude });
        
        setFormData({
          ...formData,
          location: {
            address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            coordinates: {
              longitude: longitude,
              latitude: latitude
            }
          }
        });
        setUseCurrentLocation(true);
        setLocationLoading(false);
        setMessage('✅ Location detected successfully!');
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        setMessage('Unable to get your location. Please enter address and coordinates manually.');
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Prepare the exact location structure your backend expects
      const locationData = {
        address: formData.location.address,
        coordinates: {
          longitude: formData.location.coordinates.longitude,
          latitude: formData.location.coordinates.latitude
        }
      };

      console.log('📍 Location data being sent:', JSON.stringify(locationData, null, 2));
      console.log('📤 Full form data:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        location: locationData
      });

      // Prepare form data for file upload
      const submitData = new FormData();
      
      // Append text fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      submitData.append('location', JSON.stringify(locationData));

      // Append images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      // Log what's being sent
      console.log('📦 FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Send request with FormData
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'x-user-id': api.getUserId()
          // Don't set Content-Type for FormData
        },
        body: submitData
      });

      const result = await response.json();

      console.log('📥 Backend response:', result);

      if (response.ok && result.success) {
        setMessage('✅ Report submitted successfully! Redirecting to dashboard...');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'Infrastructure',
          priority: 'Medium',
          location: {
            address: '',
            coordinates: {
              longitude: 0,
              latitude: 0
            }
          }
        });
        setImages([]);
        setUseCurrentLocation(false);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(`❌ ${result.message || 'Failed to submit report. Please try again.'}`);
        if (result.errors) {
          console.log('🔍 Backend validation errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      setMessage(`❌ Error submitting report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleManualCoordinateChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          ...formData.location.coordinates,
          [field]: numValue
        }
      }
    });
  };

  // Test with predefined coordinates
  const useTestCoordinates = () => {
    setFormData({
      ...formData,
      location: {
        address: 'Test Location - Nairobi, Kenya',
        coordinates: {
          longitude: 36.8219,
          latitude: -1.2921
        }
      }
    });
    setMessage('✅ Test coordinates loaded. You can submit now.');
  };

  return (
    <div className="card">
      <h2>Submit New Community Report</h2>
      <p>Help improve your community by reporting issues you've encountered.</p>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Debug Helper */}
      <div className="debug-helper">
        <button
          type="button"
          className="btn btn-outline"
          onClick={useTestCoordinates}
        >
          🧪 Load Test Coordinates
        </button>
        <small>Use this to test with valid coordinates</small>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Issue Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Brief description of the issue"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Priority *</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="form-select"
            required
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Location *</label>
          <div className="location-section">
            <div className="location-inputs">
              <input
                type="text"
                name="address"
                value={formData.location.address}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter address or location description"
                required
              />
              
              <button
                type="button"
                className="btn btn-outline"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? '🔄 Detecting...' : '📍 Use Current Location'}
              </button>
            </div>
            
            {/* Manual Coordinate Inputs */}
            <div className="coordinate-inputs">
              <div className="coordinate-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.latitude}
                  onChange={(e) => handleManualCoordinateChange('latitude', e.target.value)}
                  className="form-input coordinate-input"
                  placeholder="e.g., -1.2921"
                  min="-90"
                  max="90"
                  required
                />
              </div>
              <div className="coordinate-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.longitude}
                  onChange={(e) => handleManualCoordinateChange('longitude', e.target.value)}
                  className="form-input coordinate-input"
                  placeholder="e.g., 36.8219"
                  min="-180"
                  max="180"
                  required
                />
              </div>
            </div>
            
            {(useCurrentLocation || formData.location.coordinates.latitude !== 0) && (
              <div className="location-coordinates">
                <small>
                  📍 Coordinates: {formData.location.coordinates.latitude?.toFixed(6)}, {formData.location.coordinates.longitude?.toFixed(6)}
                </small>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Images (Optional)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
          />
          <small>You can select multiple images (max 5, 5MB each)</small>
          
          {images.length > 0 && (
            <div className="image-previews">
              <p>Selected images ({images.length}):</p>
              <div className="preview-grid">
                {images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Preview ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Detailed Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Please provide as much detail as possible about the issue..."
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || locationLoading}
          >
            {loading ? '🔄 Submitting...' : '📤 Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;