import React, { useState } from "react";
import { createPortal } from "react-dom";
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

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
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
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10 focus:outline-none resize-none transition-all font-medium text-gray-700"
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 font-bold text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
