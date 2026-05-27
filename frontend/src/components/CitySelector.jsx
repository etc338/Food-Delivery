import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setCurrentCity, setCurrentState, setLocationBlocked } from "../redux/userSlice";
import { FaLocationDot } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-white overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-7 pb-5 border-b border-gray-100 bg-white/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <FaLocationDot className="text-[#ff4d2d] text-xl" />
              </div>
              <h2 className="text-2xl font-black text-gray-800">Select City</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <IoClose size={24} />
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for your city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-5 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10 outline-none transition-all duration-300 font-medium text-gray-700"
            />
          </div>
        </div>

        {/* City List */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCities.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(item.city, item.state)}
                  className="w-full text-left p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#ff4d2d]/30 hover:bg-orange-50/50 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="font-bold text-gray-800 group-hover:text-[#ff4d2d] transition-colors">{item.city}</div>
                  <div className="text-xs font-semibold text-gray-400 mt-0.5">{item.state}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <FaLocationDot className="text-gray-300 text-2xl" />
              </div>
              <p className="text-gray-500 font-medium">No cities found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
