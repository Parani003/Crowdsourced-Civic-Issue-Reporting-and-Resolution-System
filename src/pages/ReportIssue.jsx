import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import MapPicker from '../components/MapPicker';
import { AlertTriangle, MapPin, Upload, Navigation, ArrowLeft, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  'Potholes',
  'Garbage Dumps',
  'Broken Streetlights',
  'Water Leakage',
  'Drainage Problems',
  'Illegal Dumping',
  'Fallen Trees',
  'Road Damage',
  'Traffic Signal Failure',
  'Public Toilet Maintenance',
];

const ReportIssue = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      category: '',
      description: '',
      address: '',
      longitude: 0,
      latitude: 0,
      priority: 'medium',
    }
  });

  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [duplicateIssue, setDuplicateIssue] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Watch fields to trigger live duplicate checking
  const selectedCategory = watch('category');
  const longitude = watch('longitude');
  const latitude = watch('latitude');

  // Trigger live duplicate checks on coordinate and category updates
  useEffect(() => {
    const triggerDuplicateCheck = async () => {
      if (!selectedCategory || !longitude || !latitude) return;
      try {
        const res = await api.post('/issues/check-duplicate', {
          category: selectedCategory,
          longitude,
          latitude
        });

        if (res.data.status === 'success' && res.data.isDuplicate) {
          setDuplicateIssue(res.data.data.issue);
          setShowDuplicateWarning(true);
        } else {
          setDuplicateIssue(null);
          setShowDuplicateWarning(false);
        }
      } catch (err) {
        console.error('Error conducting duplicate lookup:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      triggerDuplicateCheck();
    }, 600); // Debounce check to avoid spamming database queries

    return () => clearTimeout(delayDebounce);
  }, [selectedCategory, longitude, latitude]);

  const handleLocationSelect = async (coords) => {
    // coords standard format: [longitude, latitude]
    setValue('longitude', coords[0]);
    setValue('latitude', coords[1]);

    // Reverse Geocoding
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[1]}&lon=${coords[0]}&zoom=18`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setValue('address', data.display_name);
      }
    } catch (err) {
      console.error('Reverse geocoding query failed:', err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation API is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude: lng, latitude: lat } = position.coords;
        handleLocationSelect([lng, lat]);
      },
      (err) => {
        alert('Unable to retrieve your current location. Please tap coordinates on the map instead.');
      }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    if (!imageFile) {
      setApiError('Please capture or upload a photo showing the issue.');
      return;
    }

    if (data.longitude === 0 || data.latitude === 0) {
      setApiError('Please select coordinates on the map.');
      return;
    }

    setLoading(true);
    setApiError(null);

    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('address', data.address);
    formData.append('longitude', data.longitude);
    formData.append('latitude', data.latitude);
    formData.append('priority', data.priority);
    formData.append('image', imageFile);

    try {
      await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Redirect to home dashboard upon successful save
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Report Civic Issue</h1>
            <p className="text-slate-400 text-xs">Help authorities find and resolve issues in your neighborhood</p>
          </div>
        </div>

        {/* Alerts */}
        {apiError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Duplicate Warning Panel */}
        {showDuplicateWarning && duplicateIssue && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm animate-pulse-once">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-yellow-500" />
              <div>
                <strong className="font-bold block mb-0.5">Potential Duplicate Detected!</strong>
                A similar issue (<span className="underline">{duplicateIssue.category}</span>) was reported nearby by <span className="font-semibold">{duplicateIssue.createdBy?.name || 'Citizen'}</span>.
                You can upvote that report to increase its visibility rather than creating a duplicate.
              </div>
            </div>
            <Link 
              to={`/issues/${duplicateIssue._id}`} 
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-200 font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              View Existing Report
            </Link>
          </div>
        )}

        {/* Master Setup Panel */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel: Inputs */}
          <div className="glass p-6 rounded-2xl shadow-xl space-y-4">
            
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                className={`w-full px-4 py-3 bg-slate-900/60 border ${errors.category ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors text-slate-200`}
                {...register('category', { required: 'Please select an issue category' })}
              >
                <option value="" disabled className="bg-slate-950 text-slate-500">Select category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-950 text-slate-300">{cat}</option>
                ))}
              </select>
              {errors.category && (
                <span className="text-red-400 text-xs mt-1 block">{errors.category.message}</span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Provide details about the issue (e.g., depth of pothole, street name markers, safety hazards)..."
                className={`w-full px-4 py-3 bg-slate-900/60 border ${errors.description ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-600 text-slate-200 resize-none`}
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters long' }
                })}
              />
              {errors.description && (
                <span className="text-red-400 text-xs mt-1 block">{errors.description.message}</span>
              )}
            </div>

            {/* Priority selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Severity / Priority Estimation
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['low', 'medium', 'high'].map(lvl => (
                  <label key={lvl} className="cursor-pointer">
                    <input
                      type="radio"
                      value={lvl}
                      className="peer sr-only"
                      {...register('priority')}
                    />
                    <div className="py-2.5 text-center rounded-xl bg-slate-900/40 border border-slate-800 peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 text-xs font-semibold uppercase tracking-wider text-slate-400 peer-checked:text-indigo-300 transition-all select-none">
                      {lvl}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Photo Attachment
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-850 h-[180px]">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl h-[180px] cursor-pointer transition-colors group bg-slate-900/10">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
                    <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">Upload photo</span>
                    <span className="text-[10px] text-slate-600 mt-1">Supports PNG, JPG, JPEG (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Geolocation Map */}
          <div className="glass p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pinpoint Location
                </label>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Locate Me
                </button>
              </div>

              {/* Map Canvas */}
              <MapPicker 
                location={[longitude, latitude]} 
                onLocationSelect={handleLocationSelect} 
              />
              
              {/* Address display */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Resolved Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Click the map to resolve physical address..."
                    className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border ${errors.address ? 'border-red-500/50' : 'border-slate-800'} rounded-xl focus:outline-none focus:border-indigo-500/80 transition-colors placeholder:text-slate-650 text-slate-300 text-sm`}
                    readOnly={geocoding}
                    {...register('address', { required: 'Please specify the location address details.' })}
                  />
                  {geocoding && (
                    <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {errors.address && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.address.message}</span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800/60 flex gap-4">
              <Link 
                to="/"
                className="w-1/3 py-3.5 text-center text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/60 font-semibold rounded-xl transition-all text-sm cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 disabled:text-indigo-400 border border-indigo-500/35 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};

export default ReportIssue;
