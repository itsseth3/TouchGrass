import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [friends, setFriends] = useState([]); // Placeholder for friends list

  const uid = localStorage.getItem("userUID");

  useEffect(() => {
    if (!uid) {
      navigate("/");
      return;
    }

    const samplePosts = [
      {
        _id: "sample-1",
        uid: "sample-user",
        title: "Welcome to TouchGrass",
        content: "This is a sample post while the community backend is loading. Create your own post to get started.",
        createdAt: new Date().toISOString(),
        activity: "Hiking",
        likes: 12,
        comments: [{}, {}],
        visibility: "public",
      },
    ];

    const fetchPosts = async () => {
      try {
        const response = await api.get("/posts");
        setPosts(response.data);
      } catch (err) {
        setError("Unable to load posts. Please ensure the backend is running.");
        console.error("Fetch posts error:", err);
        setPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    };

  const fetchFriends = async () => {
    try {
      const response = await api.get(`/users/${uid}`);
      const currentUser = response.data;
      
      if (currentUser.friends && currentUser.friends.length > 0) {
        // Fetch friend details
        const friendDetails = await Promise.all(
          currentUser.friends.map((friendUid) =>
            api.get(`/users/${friendUid}`).then((res) => res.data)
          )
        );
        setFriends(friendDetails);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error("Fetch friends error:", err);
      setFriends([]);
    }
  };

    fetchPosts();
    fetchFriends();
  }, [uid, navigate]);

  const handleCreatePost = () => {
    navigate("/posts/create");
  };

  const handleViewPost = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleEditPost = (postId) => {
    navigate(`/posts/${postId}/edit`);
  };

  const handleFindFriends = () => {
    navigate("/findfriends");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
         <button
            onClick={() => navigate("/home")}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600">Connect with other users and share your outdoor adventures.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            {/* Create Post Button */}
            <div className="mb-6">
              <button
                onClick={handleCreatePost}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Post
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to share your outdoor adventure!</p>
                  <button
                    onClick={handleCreatePost}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-200"
                  >
                    Create Post
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200 cursor-pointer"
                    onClick={() => handleViewPost(post._id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>Posted by {post.uid === uid ? "You" : `User ${post.uid.slice(0, 8)}`}</span>
                          <span>•</span>
                          <span>{formatDate(post.createdAt)}</span>
                          {post.activity && (
                            <>
                              <span>•</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {post.activity}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {post.uid === uid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPost(post._id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-2"
                          title="Edit post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

                    {post.image && (
                      <div className="mb-4">
                        <img
                          src={post.image}
                          alt="Post image"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.comments?.length || 0}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.visibility === 'public' ? 'bg-blue-100 text-blue-800' :
                        post.visibility === 'friends' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {post.visibility}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Friends List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Friends</h2>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600 text-sm">No friends yet</p>
                  <p className="text-gray-500 text-xs mt-1">Connect with other users to build your network!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.uid} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-800 font-semibold text-sm">
                          {friend.firstName?.[0] || friend.email?.[0] || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{friend.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={handleFindFriends}
                  className="w-full text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Find Friends
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}