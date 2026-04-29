import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentCity, setCurrentState, setLocationBlocked } from "../redux/userSlice";
import { FaLocationDot } from "react-icons/fa6";

const INDIAN_CITIES = [
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Delhi", state: "Delhi" },
  { city: "Bangalore", state: "Karnataka" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Surat", state: "Gujarat" },
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Thane", state: "Maharashtra" },
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Ludhiana", state: "Punjab" },
];

export default function CitySelector({ onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();

  const filteredCities = INDIAN_CITIES.filter((item) =>
    item.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city, state) => {
    dispatch(setCurrentCity(city));
    dispatch(setCurrentState(state));
    dispatch(setLocationBlocked(false));
    
    // Store in localStorage
    localStorage.setItem("manualCity", city);
    localStorage.setItem("manualState", state);
    
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaLocationDot className="text-[#ff4d2d] text-2xl" />
              <h2 className="text-2xl font-bold text-gray-800">Select Your City</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search for your city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#ff4d2d] focus:outline-none"
          />
        </div>

        {/* City List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredCities.length > 0 ? (
            <div className="space-y-2">
              {filteredCities.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(item.city, item.state)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors border border-transparent hover:border-[#ff4d2d]"
                >
                  <div className="font-semibold text-gray-800">{item.city}</div>
                  <div className="text-sm text-gray-500">{item.state}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No cities found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
