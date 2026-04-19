import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.jsx";
import { deleteAccount } from "../firebase.jsx";

const SUGGESTION_POOL = [
  "Hiking", "Birding", "Camping", "Cycling", "Kayaking",
  "Rock Climbing", "Trail Running", "Fishing",
  "Photography"
];

const PRICE_LEVEL_OPTIONS = [
  { value: 0, label: "Free" },
  { value: 1, label: "Inexpensive" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Expensive" },
  { value: 4, label: "Very Expensive" },
];

export default function SettingsPrefs() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState(null);
  const [locationInput, setLocationInput] = useState("");
  const [searchRadius, setSearchRadius] = useState(10);
  const [preferences, setPreferences] = useState([]);
  const [prefInput, setPrefInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [excludedPreferences, setExcludedPreferences] = useState([]);
  const [excludedPrefInput, setExcludedPrefInput] = useState("");
  const [excludedSuggestions, setExcludedSuggestions] = useState([]);
  const [priceLevels, setPriceLevels] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [activeSection, setActiveSection] = useState("account");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [error, setError] = useState("");



  const handlePrefInput = (e) => {
    const val = e.target.value;
    setPrefInput(val);
    if (val.trim().length > 0) {
      setSuggestions(
        SUGGESTION_POOL.filter(
          (s) =>
            s.toLowerCase().includes(val.toLowerCase()) &&
            !preferences.includes(s)
        )
      );
    } else {
      setSuggestions([]);
    }
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
        type: "Point",
        coordinates: [locationResult.lng, locationResult.lat],
      });
      setLocationInput(result.formatted_address || selectedLocation.description || selectedLocation.place_id);
      setLocationSuggestions([]);
      setError("");
    } catch (err) {
      console.error("Location select error:", err);
      setError("Error selecting location. Please try again.");
    }
  };

  const handleLocationInputChange = (e) => {
    const { value } = e.target;
    setLocationInput(value);
    setLocation(null);
    handleLocationSearch(value);
  };

  const addPreference = (pref) => {
    if (!preferences.includes(pref)) {
      setPreferences([...preferences, pref]);
    }
    setPrefInput("");
    setSuggestions([]);
  };

  const removePreference = (pref) => {
    setPreferences(preferences.filter((p) => p !== pref));
  };

  const handlePrefKeyDown = (e) => {
    if (e.key === "Enter" && prefInput.trim()) {
      addPreference(prefInput.trim());
    }
  };

  const handleExcludedPrefInput = (e) => {
    const val = e.target.value;
    setExcludedPrefInput(val);
    if (val.trim().length > 0) {
      setExcludedSuggestions(
        SUGGESTION_POOL.filter(
          (s) =>
            s.toLowerCase().includes(val.toLowerCase()) &&
            !excludedPreferences.includes(s)
        )
      );
    } else {
      setExcludedSuggestions([]);
    }
  };

  const addExcludedPreference = (pref) => {
    if (!excludedPreferences.includes(pref)) {
      setExcludedPreferences([...excludedPreferences, pref]);
    }
    setExcludedPrefInput("");
    setExcludedSuggestions([]);
  };

  const removeExcludedPreference = (pref) => {
    setExcludedPreferences(excludedPreferences.filter((p) => p !== pref));
  };

  const handleExcludedPrefKeyDown = (e) => {
    if (e.key === "Enter" && excludedPrefInput.trim()) {
      addExcludedPreference(excludedPrefInput.trim());
    }
  };

  const togglePriceLevel = (level) => {
    setPriceLevels((prev) =>
      prev.includes(level)
        ? prev.filter((item) => item !== level)
        : [...prev, level]
    );
  };

  const saveAccountChanges = async () => {
    const uid = localStorage.getItem("userUID");

    if (!uid) {
      setAccountStatus("No signed-in user found.");
      return;
    }

    const payload = {
      ...(firstName.trim() && { firstName: firstName.trim() }),
      ...(lastName.trim() && { lastName: lastName.trim() }),
      ...(location && { location }),
      ...(locationInput.trim() && { locationName: locationInput.trim() }),
    };

    if (Object.keys(payload).length === 0) {
      setAccountStatus("No account changes to save.");
      return;
    }

    try {
      setIsSavingAccount(true);
      setAccountStatus("");
      await api.patch(`/users/${uid}`, payload);
      setAccountStatus("Account changes saved.");
    } catch (error) {
      console.error("Failed to save account changes:", error);
      setAccountStatus("Failed to save account changes.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    const uid = localStorage.getItem("userUID");

    if (!uid) {
      setSaveStatus("No signed-in user found.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus("");

      await api.patch(`/users/${uid}`, {
        preferences: {
          includedTypes: preferences,
          excludedTypes: excludedPreferences,
          priceLevels,
          minRating: Number(minRating),
          radiusMeters: Math.round(Number(searchRadius) * 1609.34),
        },
      });

      setSaveStatus("Preferences saved.");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setSaveStatus("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleHomeClick = async () => {
    await savePreferences();
    await saveAccountChanges();
    navigate("/home");
  };

  const handleDeleteAccount = async () => {
    const uid = localStorage.getItem("userUID");

    if (!uid) {
      setDeleteStatus("No signed-in user found.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteStatus("");
      await deleteAccount(uid, deletePassword);
      setDeleteStatus("Account deleted. Redirectig...");
      setDeletePassword("");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Failed to delete account:", error);
      const message = error?.message || "Failed to delete account.";
      setDeleteStatus(message);

    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-blue-50 py-8 px-4">
      <button type="button"
       onClick={handleHomeClick} 
       className="fixed top-4 left-4 mb-6 bg-emerald-700 text-white rounded-xl py-3 px-6 text-sm font-semibold
        hover:bg-emerald-800 transition-colors">
          Home
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 p-2 self-start">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
            <p className="text-slate-500 text-sm mb-6">Manage your account and preferences</p>

            <div className="flex flex-col gap-3 pl-6">
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className={`text-left text-base font-semibold transition-colors ${
                  activeSection === "account"
                    ? "text-emerald-700 font-bold"
                    : "text-slate-600 hover:text-emerald-600 hover:font-bold"
                }`}
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("preferences")}
                className={`text-left text-base font-semibold transition-colors ${
                  activeSection === "preferences"
                    ? "text-emerald-700 font-bold"
                    : "text-slate-600 hover:text-emerald-600 hover:font-bold"
                }`}
              >
                Preferences
              </button>
            </div>
          </aside>

          <section className="flex-1 bg-white rounded-2xl shadow-lg p-8">
            {activeSection === "account" ? (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Account</h2>
                  <p className="text-slate-500 text-sm mt-1">Update your profile details and default location.</p>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      placeholder="First"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Default Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={handleLocationInputChange}
                      placeholder="Search for a location (e.g., Gainesville, Florida)..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

                  {locationSuggestions.length === 0 && locationInput && locationInput.length >= 2 && !location && (
                    <p className="text-slate-500 text-sm mt-2">
                      No suggestions found. Try a more specific location.
                    </p>
                  )}

                  {location && (
                    <p className="text-emerald-600 text-sm mt-2">
                      ✓ Location selected: {locationInput}
                    </p>
                  )}

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <button
                  type="button"
                  onClick={saveAccountChanges}
                  disabled={isSavingAccount}
                  className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingAccount ? "Saving..." : "Save Account Changes"}
                </button>
                {accountStatus && (
                  <p className="text-sm text-slate-500">{accountStatus}</p>
                )}

                <div className="pt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full border border-red-200 text-red-500 rounded-xl py-3 text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 border border-red-100 rounded-xl p-4 bg-red-50">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Confirm with password</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword("");
                            setDeleteStatus("");
                          }}
                          className="flex-1 border border-slate-200 bg-white text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                  {deleteStatus && (
                    <p className={`text-sm ${deleteStatus.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}>
                      {deleteStatus}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Preferences</h2>
                  <p className="text-slate-500 text-sm mt-1">Choose the activities, budget, distance, and rating you want to see.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Search Radius —{" "}
                    <span className="text-emerald-700 font-semibold">{searchRadius} mi</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(e.target.value)}
                    className="w-full accent-emerald-700"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Included Activity Types</label>

                  {preferences.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {preferences.map((pref) => (
                        <span
                          key={pref}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm px-3 py-1.5 rounded-full"
                        >
                          {pref}
                          <button
                            onClick={() => removePreference(pref)}
                            className="text-emerald-500 hover:text-emerald-800 font-medium leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search or add included preferences..."
                      value={prefInput}
                      onChange={handlePrefInput}
                      onKeyDown={handlePrefKeyDown}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => addPreference(s)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Press Enter to add an included activity type</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Excluded Activity Types</label>

                  {excludedPreferences.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {excludedPreferences.map((pref) => (
                        <span
                          key={pref}
                          className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-sm px-3 py-1.5 rounded-full"
                        >
                          {pref}
                          <button
                            onClick={() => removeExcludedPreference(pref)}
                            className="text-rose-500 hover:text-rose-800 font-medium leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search or add excluded preferences..."
                      value={excludedPrefInput}
                      onChange={handleExcludedPrefInput}
                      onKeyDown={handleExcludedPrefKeyDown}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {excludedSuggestions.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                        {excludedSuggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => addExcludedPreference(s)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Press Enter to add an excluded activity type</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Budget / Price Levels</label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {PRICE_LEVEL_OPTIONS.map((option) => {
                      const selected = priceLevels.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => togglePriceLevel(option.value)}
                          className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                            selected
                              ? "bg-emerald-700 text-white border-emerald-700"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Minimum Rating — <span className="text-emerald-700 font-semibold">{Number(minRating).toFixed(1)}★</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full accent-emerald-700"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Any</span>
                    <span>5★</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="w-full bg-emerald-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
                {saveStatus && (
                  <p className="text-sm text-slate-500">{saveStatus}</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}