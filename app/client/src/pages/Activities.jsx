import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.jsx";

const PRICE_LEVELS = [
  { value: 0, label: "Free" },
  { value: 1, label: "Inexpensive" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Expensive" },
  { value: 4, label: "Very Expensive" },
];

const formatPriceLevel = (level) => {
  switch (level) {
    case 0:
      return "Free";
    case 1:
      return "Inexpensive";
    case 2:
      return "Moderate";
    case 3:
      return "Expensive";
    case 4:
      return "Very Expensive";
    default:
      return "Unknown";
  }
};

const SEARCH_QUERY_MAP = {
  outdoors: "hiking trails kayaking biking outdoor activities",
  outdoor: "hiking trails kayaking biking outdoor activities",
  "date night": "restaurants bars theaters movies",
  entertainment: "theaters movies museums arcades",
  active: "gyms fitness classes sports",
};

const getPhotoUrl = (photoReference) =>
  photoReference
    ? `http://localhost:3000/api/places/photo?photoReference=${encodeURIComponent(photoReference)}&maxwidth=800`
    : null;

export default function Activities() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationSource, setLocationSource] = useState("saved");
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [saveLocationStatus, setSaveLocationStatus] = useState("");
  const [preferences, setPreferences] = useState({
    includedTypes: [],
    excludedTypes: [],
    priceLevels: [],
    minRating: 0,
    radiusMeters: 16093,
    openNow: false,
  });
  const [searchTerms, setSearchTerms] = useState("");
  const [searchRadius, setSearchRadius] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [priceLevels, setPriceLevels] = useState([]);
  const [openNow, setOpenNow] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildSearchTags = () => {
    const tags = searchTerms
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    return tags.length ? tags : preferences.includedTypes;
  };

  const buildSearchQuery = () => {
    const tags = buildSearchTags();
    if (!tags.length) return "outdoor activities";

    return tags
      .map((tag) => SEARCH_QUERY_MAP[tag.toLowerCase()] || tag)
      .join(" ");
  };

  const handleLocationSearch = async (query) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await api.get("/places/autocomplete", {
        params: {
          input: query,
        },
      });

      setLocationSuggestions(response.data.predictions || []);
      setError("");
    } catch (err) {
      console.error("Location search error:", err);
      setError("Error: Cannot search location");
    }
  };

  const handleLocationSelect = async (selectedLocation) => {
    try {
      const response = await api.get("/places/details", {
        params: {
          place_id: selectedLocation.place_id,
          fields: "geometry,formatted_address,name",
        },
      });
      const result = response.data.result || response.data;
      const locationResult = result.geometry?.location;
      if (!locationResult) {
        throw new Error("No location geometry returned.");
      }

      setLocation({
        lat: locationResult.lat,
        lng: locationResult.lng,
      });
      setManualLocationInput(result.formatted_address || selectedLocation.description || selectedLocation.place_id);
      setLocationSuggestions([]);
      setError("");
    } catch (err) {
      console.error("Location select error:", err);
      setError("Error selecting location. Please try again.");
    }
  };

  const handleManualLocationInputChange = (e) => {
    const { value } = e.target;
    setManualLocationInput(value);
    setLocationSource("manual");
    setSaveLocationStatus("");
    handleLocationSearch(value);
  };

  useEffect(() => {
    const uid = localStorage.getItem("userUID");
    if (!uid) {
      navigate("/");
      return;
    }

    const loadUser = async () => {
      try {
        const response = await api.get(`/users/${uid}`);
        const userData = response.data;
        setUser(userData);

        const pref = userData.preferences || {};
        const radiusValue = pref.radiusMeters
          ? Math.max(1, Math.round(pref.radiusMeters / 1609.34))
          : 10;

        setPreferences({
          includedTypes: pref.includedTypes || [],
          excludedTypes: pref.excludedTypes || [],
          priceLevels: pref.priceLevels || [],
          minRating: pref.minRating || 0,
          radiusMeters: pref.radiusMeters || 16093,
          openNow: pref.openNow || false,
        });
        setPriceLevels(pref.priceLevels || []);
        setMinRating(pref.minRating || 0);
        setSearchRadius(radiusValue);
        setOpenNow(pref.openNow || false);

        const terms = pref.includedTypes?.length
          ? pref.includedTypes.join(", ")
          : "outdoors, date night, entertainment";
        setSearchTerms(terms);

        if (userData.location?.coordinates?.length === 2) {
          const [lng, lat] = userData.location.coordinates;
          setLocation({ lat, lng });
          setLocationName(userData.locationName || "Unknown city");
          setLocationSource("saved");
        } else {
          setError("Please set your location in Settings & Preferences to receive recommendations.");
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load preferences. Please refresh or check your settings.");
      }
    };

    loadUser();
  }, [navigate]);

  const fetchRecommendations = async ({
    lat,
    lng,
    tags,
    radius,
    minRating: overrideMinRating,
    priceLevels: overridePriceLevels,
    openNow: overrideOpenNow,
  } = {}) => {
    const currentLocation = location || (lat && lng ? { lat, lng } : null);
    if (!currentLocation && locationSource === "saved") {
      setError("Please set location in Settings & Preferences before searching.");
      return;
    }

    const tagsList = tags || buildSearchQuery();
    if (!tagsList.trim()) {
      setError("Add at least one keyword or preference tag to search for activities.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setHasSearched(true);
      let effectiveLocation = currentLocation;
      if (locationSource === "manual") {
        if (!location) {
          setError("Please select a location from the suggestions before searching.");
          setLoading(false);
          return;
        }
        effectiveLocation = location;
      }

      const params = {
        lat: effectiveLocation.lat,
        lng: effectiveLocation.lng,
        radius: Math.max(100, Math.round((radius ?? searchRadius) * 1609.34)),
        tags: tagsList,
        minRating: overrideMinRating ?? minRating,
        priceLevels: (overridePriceLevels ?? priceLevels).join(","),
        openNow: String(overrideOpenNow ?? openNow),
      };

      const response = await api.get("/places/search", { params });
      const rawResults = response.data.results || [];
      const filteredResults = rawResults.filter((place) => {
        if (!preferences.excludedTypes?.length) return true;
        return !preferences.excludedTypes.some((excluded) => {
          const lowerExcluded = excluded.toLowerCase();
          return (
            place.name?.toLowerCase().includes(lowerExcluded) ||
            place.types?.some((type) => type.toLowerCase().includes(lowerExcluded))
          );
        });
      });

      if (!filteredResults.length) {
        setError("No recommendations matched your preferences. Try broader keywords or update your settings.");
      }

      setRecommendations(filteredResults);
    } catch (searchError) {
      console.error(searchError);
      setError("Unable to load recommendations. Please try again later.");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = () => {
    fetchRecommendations();
  };

  const handlePriceToggle = (level) => {
    setPriceLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level]
    );
  };

  const openMapsLink = (place) => {
    const query = encodeURIComponent(`${place.name} ${place.address}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const saveManualLocation = async () => {
    setSaveLocationStatus("");
    if (!location) {
      setError("Please select a location from the suggestions before saving.");
      return;
    }

    try {
      setLoading(true);
      const uid = localStorage.getItem("userUID");
      if (!uid) {
        setError("No signed-in user found.");
        return;
      }

      const payload = {
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
        locationName: manualLocationInput.trim(),
      };

      await api.patch(`/users/${uid}`, payload);
      setLocationName(manualLocationInput.trim());
      setLocationSource("saved");
      setSaveLocationStatus("Location saved.");
      setError("");
    } catch (saveError) {
      console.error(saveError);
      setError("Failed to save location. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Activities</h1>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
              Personalized activity recommendations based on your saved preferences and location.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settingsandpreferences")}
            className="w-full md:w-auto bg-emerald-700 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            Update Settings & Preferences
          </button>
        </div>

        <div className="grid gap-6">
          <section className="space-y-6 bg-white rounded-3xl p-6 shadow-md">
            <div className="space-y-3 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Your search settings</h2>
                <p className="text-slate-500 mt-1">Use your saved preferences or add custom tags for tailored recommendations.</p>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleUpdateClick}
                  className="bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Activity tags</span>
                <input
                  value={searchTerms}
                  onChange={(event) => setSearchTerms(event.target.value)}
                  placeholder="outdoors, date night, entertainment"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Search radius (miles)</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(event) => setSearchRadius(Number(event.target.value))}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Minimum rating</span>
                  <select
                    value={minRating}
                    onChange={(event) => setMinRating(Number(event.target.value))}
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={0}>Any rating</option>
                    <option value={3}>3.0+</option>
                    <option value={4}>4.0+</option>
                    <option value={4.5}>4.5+</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Budget / Price levels</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_LEVELS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handlePriceToggle(option.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${priceLevels.includes(option.value)
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(event) => setOpenNow(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Only show open now</span>
              </label>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationSource("saved")}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${locationSource === "saved"
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Saved location
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationSource("manual")}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${locationSource === "manual"
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Enter location
                    </button>
                  </div>

                  {locationSource === "saved" ? (
                    <div>
                      <p className="text-sm text-slate-700">Saved location:</p>
                      <p className="font-semibold text-slate-900">{locationName || "No saved location"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-700">City name</p>
                        <div className="relative">
                          <input
                            type="text"
                            value={manualLocationInput}
                            onChange={handleManualLocationInputChange}
                            placeholder="Gainesville, Florida"
                            className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                          />
                          {locationSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
                              {locationSuggestions.map((locationOption) => (
                                <button
                                  key={locationOption.place_id || locationOption.description}
                                  type="button"
                                  onClick={() => handleLocationSelect(locationOption)}
                                  className="w-full text-left px-4 py-2 hover:bg-emerald-100 border-b border-slate-200 last:border-b-0 text-sm"
                                >
                                  {locationOption.description || locationOption.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={saveManualLocation}
                          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                        >
                          Save location
                        </button>
                        {saveLocationStatus ? (
                          <p className="text-sm text-emerald-700">{saveLocationStatus}</p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-700 mt-2">
                    Excluded tags: <span className="font-medium text-slate-900">{preferences.excludedTypes?.join(', ') || 'None'}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Recommendations</h2>
              <p className="text-sm text-slate-600">
                These suggestions are generated from your saved preferences and nearby places.
              </p>
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-3xl bg-white p-6 shadow-md text-center text-slate-700">
                Loading recommendations...
              </div>
            ) : null}

            <div className="grid gap-6">
              {recommendations.map((place) => {
                const photoUrl = getPhotoUrl(place.photos?.[0]?.photo_reference);
                const fallbackImage = place.icon || "https://via.placeholder.com/800x450?text=Activity+Spot";
                return (
                  <article key={place.place_id} className="overflow-hidden rounded-3xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="overflow-hidden">
                      <img
                        src={photoUrl || fallbackImage}
                        alt={place.name || "Recommended place"}
                        className="h-64 w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{place.name}</h3>
                          <p className="text-sm text-slate-500">{place.formatted_address || place.vicinity}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Rating: {place.rating ?? 'N/A'}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Price: {place.price_level !== undefined ? formatPriceLevel(place.price_level) : 'Any'}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Reviews: {place.user_ratings_total ?? 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-3">
                        <a
                          href={openMapsLink(place)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white text-center transition hover:bg-emerald-800"
                        >
                          View in Maps
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!loading && hasSearched && !recommendations.length && !error ? (
                <div className="rounded-3xl bg-white p-6 shadow-md text-slate-700">
                  No activity recommendations matched your filters. Try broader tags or update your settings.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
