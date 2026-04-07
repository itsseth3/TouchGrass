import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function ViewPost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const uid = localStorage.getItem("userUID");
  const username = localStorage.getItem("userName") || "Anonymous";
  const isOwner = post?.uid === uid;
  const isLiked = post?.likedBy?.includes(uid);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        setPost(response.data);
        setLoading(false);
      } catch (err) {
        setError("Error loading post");
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    if (!uid) {
      navigate("/");
      return;
    }

    try {
      const endpoint = isLiked ? "unlike" : "like";
      const response = await api.patch(`/posts/${postId}/${endpoint}`, { uid });
      setPost(response.data);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !uid) return;

    setSubmittingComment(true);
    try {
      const response = await api.patch(`/posts/${postId}/comment`, {
        uid,
        username,
        text: commentText,
      });
      setPost(response.data);
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await api.patch(`/posts/${postId}/comment/${commentId}`);
      setPost(response.data);
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      navigate("/home");
    } catch (err) {
      setError("Error deleting post");
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Post not found"}</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-green-500 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-green-600 hover:text-green-700 font-semibold"
        >
          ← Back
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {post.title}
                </h1>
                <p className="text-gray-600 text-sm">
                  {new Date(post.createdAt).toLocaleDateString()} {" "}
                  {new Date(post.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/posts/${postId}/edit`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              {post.activity && (
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Activity:</span> {post.activity}
                </p>
              )}
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Visibility:</span>{" "}
                <span className="capitalize">{post.visibility}</span>
              </p>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Location:</span> [{" "}
                {post.location.coordinates.join(", ")} ]
              </p>
            </div>

            {/* Like section */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span>❤️</span>
                <span>{post.likes}</span>
              </button>
              <span className="text-gray-600">
                {post.comments.length} comments
              </span>
            </div>

            {/* Comments section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Comments</h2>

              {/* Add comment */}
              {uid && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </form>
              )}

              {/* Comments list */}
              <div className="space-y-4">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-800">
                          {comment.username}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.text}</p>
                      {comment.uid === uid && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No comments yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
