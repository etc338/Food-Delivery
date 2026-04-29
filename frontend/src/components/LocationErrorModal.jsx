import React from "react";
import { FaLocationDot, FaCircleExclamation } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

export default function LocationErrorModal({ error, onClose, onRetry }) {
  const getErrorContent = () => {
    switch (error) {
      case "NOT_SUPPORTED":
        return {
          title: "Geolocation Not Supported",
          message: "Your browser doesn't support geolocation. Please use a modern browser or select your city manually.",
          icon: <FaCircleExclamation size={64} className="text-orange-500" />,
        };
      case "PERMISSION_DENIED":
        return {
          title: "Location Access Denied",
          message: "You've blocked location access. Please enable it in your browser settings to see nearby restaurants.",
          icon: <FaLocationDot size={64} className="text-[#ff4d2d]" />,
          instructions: [
            {
              browser: "Chrome",
              steps: "Click the lock icon in address bar → Site settings → Location → Allow"
            },
            {
              browser: "Firefox",
              steps: "Click the shield/lock icon → Permissions → Location → Allow"
            },
            {
              browser: "Safari",
              steps: "Safari menu → Settings for This Website → Location → Allow"
            },
            {
              browser: "Edge",
              steps: "Click the lock icon → Permissions for this site → Location → Allow"
            }
          ]
        };
      case "POSITION_UNAVAILABLE":
        return {
          title: "Location Unavailable",
          message: "We couldn't determine your location. Please check your device's location settings or try again.",
          icon: <FaCircleExclamation size={64} className="text-orange-500" />,
        };
      case "TIMEOUT":
        return {
          title: "Location Request Timed Out",
          message: "The location request took too long. Please check your internet connection and try again.",
          icon: <FaCircleExclamation size={64} className="text-orange-500" />,
        };
      default:
        return {
          title: "Location Error",
          message: "Something went wrong. Please try again or select your city manually.",
          icon: <FaCircleExclamation size={64} className="text-orange-500" />,
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            {content.icon}
            <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-lg mb-6">{content.message}</p>

          {/* Browser-specific instructions */}
          {content.instructions && (
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaCircleExclamation className="text-[#ff4d2d]" />
                How to Enable Location:
              </h3>
              <div className="space-y-3">
                {content.instructions.map((instruction, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <div className="font-semibold text-[#ff4d2d] mb-1">
                      {instruction.browser}:
                    </div>
                    <div className="text-sm text-gray-600">
                      {instruction.steps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {onRetry ? "Close" : "Got It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
