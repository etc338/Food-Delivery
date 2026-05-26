import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";

export default function ReviewModal({ order, shopId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [foodQuality, setFoodQuality] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please provide a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${serverUrl}/api/review/add`,
        {
          shopId,
          orderId: order._id,
          rating,
          comment,
          deliveryRating,
          foodQuality,
        },
        { withCredentials: true }
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={32}
            className={`cursor-pointer transition-colors ${
              star <= (label === "Overall Rating" ? (hoverRating || value) : value)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => onChange(star)}
            onMouseEnter={() => label === "Overall Rating" && setHoverRating(star)}
            onMouseLeave={() => label === "Overall Rating" && setHoverRating(0)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Rating */}
          <StarRating
            value={rating}
            onChange={setRating}
            label="Overall Rating *"
          />

          {/* Food Quality */}
          <StarRating
            value={foodQuality}
            onChange={setFoodQuality}
            label="Food Quality"
          />

          {/* Delivery Rating */}
          <StarRating
            value={deliveryRating}
            onChange={setDeliveryRating}
            label="Delivery Experience"
          />

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#ff4d2d] focus:outline-none resize-none"
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#ff4d2d] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
