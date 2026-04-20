import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function FindFriends() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sentRequests, setSentRequests] = useState(new Set());
  const [incomingRequests, setIncomingRequests] = useState(new Set());

  const uid = localStorage.getItem("userUID");

  useEffect(() => {
    if (!uid) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all users
        const usersResponse = await api.get("/users/search/all/users");
        const currentUserResponse = await api.get(`/users/${uid}`);
        const currentUser = currentUserResponse.data || {
          friends: [],
          friendRequests: { incoming: [], outgoing: [] },
        };

        const filteredUsers = (usersResponse.data || []).filter(
          (user) => user.uid !== uid && !currentUser.friends?.includes(user.uid)
        );

        setUsers(filteredUsers);

        const sent = new Set(
          (currentUser.friendRequests?.outgoing || [])
            .filter((req) => req.status === "pending")
            .map((req) => req.uid)
        );
        setSentRequests(sent);

        const incoming = new Set(
          (currentUser.friendRequests?.incoming || [])
            .filter((req) => req.status === "pending")
            .map((req) => req.uid)
        );
        setIncomingRequests(incoming);

        setError("");
      } catch (err) {
        setError("Error loading users. Please try again.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, navigate]);

  const handleSendRequest = async (targetUid) => {
    try {
      await api.post(`/users/${uid}/friend-requests/${targetUid}`);
      setSentRequests((prev) => new Set([...prev, targetUid]));
    } catch (err) {
      setError(err.response?.data?.message || "Error sending friend request");
      console.error("Send request error:", err);
    }
  };

  const handleAcceptRequest = async (senderUid) => {
    try {
      await api.patch(`/users/${uid}/friend-requests/${senderUid}/accept`);
      setIncomingRequests((prev) => {
        const updated = new Set(prev);
        updated.delete(senderUid);
        return updated;
      });
      // Remove from user list if they're shown
      setUsers((prev) => prev.filter((user) => user.uid !== senderUid));
    } catch (err) {
      setError("Error accepting friend request");
      console.error("Accept error:", err);
    }
  };

  const handleDeclineRequest = async (senderUid) => {
    try {
      await api.patch(`/users/${uid}/friend-requests/${senderUid}/decline`);
      setIncomingRequests((prev) => {
        const updated = new Set(prev);
        updated.delete(senderUid);
        return updated;
      });
    } catch (err) {
      setError("Error declining friend request");
      console.error("Decline error:", err);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/community")}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Community
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Friends</h1>
          <p className="text-gray-600">Connect with other outdoor enthusiasts and build your network!</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Incoming Requests Section */}
        {incomingRequests.size > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Friend Requests ({incomingRequests.size})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users
                  .filter((user) => incomingRequests.has(user.uid))
                  .map((user) => (
                    <div
                      key={user.uid}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-800 font-semibold">
                            {user.firstName?.[0] || "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handleAcceptRequest(user.uid)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(user.uid)}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium py-2 rounded transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Search and Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users available</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search" : "Check back later for more users"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className="bg-gradient-to-br from-green-50 to-blue-50 border border-gray-200 rounded-lg p-4 flex flex-col hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-800 font-semibold">
                        {user.firstName?.[0] || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>

                  {sentRequests.has(user.uid) ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-700 text-sm font-medium py-2 rounded transition cursor-not-allowed"
                    >
                      Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.uid)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded transition"
                    >
                      Send Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
