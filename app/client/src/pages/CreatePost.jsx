import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api";

export default function CreatePost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    activity: "",
    image: "",
    visibility: "public",
    location: null,
    locationName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  // Get current user info from localStorage/Firebase
  const uid = localStorage.getItem("userUID");

  useEffect(() => {
    if (!uid) {
      navigate("/");
    }
  }, [uid, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSearch = async (query) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=8&countrycodes=us&type=city,town,village`
      );
      setLocationSuggestions(response.data);
    } catch (err) {
      console.error("Location search error:", err);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        type: "Point",
        coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
      },
      locationName: location.display_name,
    }));
    setLocationSuggestions([]);
  };

  const handleLocationInputChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      locationName: value,
    }));
    handleLocationSearch(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        setError("Title and content are required");
        setLoading(false);
        return;
      }

      if (!formData.location) {
        setError("Please select a location");
        setLoading(false);
        return;
      }

      const postData = {
        uid,
        title: formData.title,
        content: formData.content,
        activity: formData.activity,
        image: formData.image,
        visibility: formData.visibility,
        location: formData.location,
      };

      const response = await api.post("/posts", postData);
      navigate(`/posts/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating post");
      console.error("Post creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Create a Post</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What's your post about?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Description *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Tell us more about your post..."
              rows="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Location *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.locationName}
                onChange={handleLocationInputChange}
                placeholder="Search for a location (e.g., Gainesville, Florida)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {locationSuggestions.map((location, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-4 py-2 hover:bg-green-100 border-b border-gray-200 last:border-b-0 text-sm"
                    >
                      {location.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Show suggestions hint */}
            {locationSuggestions.length === 0 && formData.locationName && formData.locationName.length >= 2 && !formData.location && (
              <p className="text-gray-500 text-sm mt-2">
                No suggestions found. Click below to use "{formData.locationName}" as your location.
              </p>
            )}
            
            {/* Manual location confirmation button */}
            {formData.locationName && !formData.location && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      type: "Point",
                      coordinates: [0, 0], // Placeholder - will be geocoded
                    },
                  }));
                  setLocationSuggestions([]);
                }}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Use "{formData.locationName}"
              </button>
            )}
            
            {formData.location && (
              <p className="text-green-600 text-sm mt-2">
                ✓ Location selected: {formData.locationName}
              </p>
            )}
          </div>

          {/* Activity Type */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Activity Type
            </label>
            <input
              type="text"
              name="activity"
              value={formData.activity}
              onChange={handleInputChange}
              placeholder="e.g., Hiking, Running, Yoga"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Image URL */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-3 h-48 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create Post"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
