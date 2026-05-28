import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import DeliveryBoyTracking from "./DeliveryBoyTracking";
import useUpdateLocation from "../hooks/useUpdateLocation";
import { useSocket } from "../context/SocketContext";
import { FaMapMarkerAlt, FaCircle, FaBiking, FaBoxOpen } from "react-icons/fa";

export default function DeliveryBoy() {
  const { userData } = useSelector((state) => state.user);
  const [currentOrder, setCurrentOrder] = useState();
  const [avavilableAssignments, setAvavilableAssignments] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [isOnline, setIsOnline] = useState(userData?.isOnline || false);

  useUpdateLocation();
  const socketRef = useSocket();

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, {
        withCredentials: true,
      });
      setAvavilableAssignments(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-current-order`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data);
    } catch (error) {
      setCurrentOrder(null);
      console.error(error);
    }
  };

  const acceptOrder = async (assignmentId) => {
    try {
      await axios.get(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        { withCredentials: true },
      );
      await getCurrentOrder();
      setAvavilableAssignments([]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await axios.put(
        `${serverUrl}/api/user/toggle-status`,
        { isOnline: newStatus },
        { withCredentials: true }
      );
      setIsOnline(newStatus);
      if (newStatus) {
        getAssignments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAssignments();
    getCurrentOrder();
  }, [userData]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleNewAssignment = () => {
      getAssignments();
    };

    const handleAssignmentTaken = ({ assignmentId }) => {
      setAvavilableAssignments((prev) =>
        prev ? prev.filter((a) => a.assignmentId !== assignmentId) : []
      );
    };

    socket.on("new:assignment", handleNewAssignment);
    socket.on("assignment:taken", handleAssignmentTaken);

    return () => {
      socket.off("new:assignment", handleNewAssignment);
      socket.off("assignment:taken", handleAssignmentTaken);
    };
  }, [socketRef?.current]);

  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const coords = userData?.location?.coordinates;
        if (!coords || !coords.length) return;
        const lat = coords[1];
        const lon = coords[0];
        if (lat === 0 && lon === 0) return;

        const apiKey = import.meta.env.VITE_GEOAPIKEY;
        if (!apiKey) return;
        const res = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apiKey}`,
        );
        const place = res?.data?.results?.[0];
        if (place)
          setLocationName(
            place.address_line2 ||
              place.address_line1 ||
              place.formatted ||
              place.city ||
              place.state,
          );
      } catch (err) {
        console.log("Reverse geocode failed", err);
      }
    };
    fetchLocationName();
  }, [userData?.location]);

  return (
    <div className="w-full min-h-screen bg-[#fcfaf8] flex flex-col items-center pb-20">
      <Nav />
      <div className="w-full max-w-[900px] flex flex-col gap-6 items-center px-4 mt-8 animate-slideUp">
        
        {/* Profile Card */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col justify-center text-center gap-4 items-center w-full border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-3 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55]"></div>
          
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 mt-2 mb-1 shadow-sm">
            <FaBiking className="text-[#ff4d2d] text-3xl" />
          </div>
          
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55]">{userData?.fullName}</span>
          </h1>
          
          {/* EARNINGS WALLET DISPLAY */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100/50 px-8 py-4 rounded-[20px] border border-green-200 shadow-sm mt-2 mb-1 w-full max-w-[250px] transform transition-transform hover:scale-105">
            <span className="text-[11px] font-black text-green-600 uppercase tracking-widest mb-1">Lifetime Earnings</span>
            <span className="text-3xl font-black text-green-700">₹{userData?.totalEarnings || 0}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50/80 px-5 py-2.5 rounded-2xl text-sm font-medium border border-gray-100">
            <FaMapMarkerAlt className="text-[#ff4d2d]" />
            {locationName ? (
              <span className="text-gray-600 line-clamp-1">{locationName}</span>
            ) : (
              <span className="text-gray-600">
                Lat: {userData?.location?.coordinates?.[1]?.toFixed(4) ?? 0}, 
                Lng: {userData?.location?.coordinates?.[0]?.toFixed(4) ?? 0}
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 p-3 bg-gray-50 rounded-2xl w-full sm:w-auto">
            <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {isOnline ? (
                <><FaCircle className="text-[10px] animate-pulse" /> Online (Receiving Orders)</>
              ) : (
                <><FaCircle className="text-[10px]" /> Offline (Not Working)</>
              )}
            </div>
            
            <div className="w-[1px] h-8 bg-gray-200 hidden sm:block"></div>
            
            <button 
              onClick={handleToggleOnline}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${isOnline ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Offline State */}
        {!currentOrder && !isOnline && (
          <div className="bg-white rounded-[32px] p-10 shadow-sm w-full border border-gray-100 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="text-6xl mb-4 opacity-50 filter grayscale">😴</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">You are Offline</h2>
            <p className="text-gray-500 font-medium max-w-md">Toggle your status to Online above to start receiving delivery assignments in your area.</p>
          </div>
        )}

        {/* Available Assignments */}
        {!currentOrder && isOnline && (
          <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full border border-gray-100 flex flex-col gap-6 animate-fadeIn">
            <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
              <span className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100">
                <FaMapMarkerAlt className="text-[#ff4d2d] text-lg" />
              </span> 
              Available Orders Nearby
            </h2>

            <div className="space-y-4 w-full">
              {avavilableAssignments?.length > 0 ? (
                avavilableAssignments.map((a, index) => (
                  <div
                    className="border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:shadow-lg hover:border-orange-200 transition-all duration-300 bg-gray-50/50 group"
                    key={index}
                  >
                    <div className="flex flex-col gap-2 w-full sm:w-[70%]">
                      <p className="text-lg font-black text-gray-800 group-hover:text-[#ff4d2d] transition-colors">{a?.shopName}</p>
                      
                      <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100">
                        <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-600 line-clamp-2">
                          {a?.deliveryAddress?.text || a?.deliveryAddress}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg shadow-sm">
                          {a?.items?.length || 0} Items
                        </span>
                        <span className="text-sm font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg shadow-sm">
                          ₹{a.subtotal || 0}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => acceptOrder(a.assignmentId)}
                      className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#ff4d2d]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 w-full sm:w-auto flex-shrink-0"
                    >
                      Accept Order
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <FaBoxOpen className="text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold text-lg text-center">
                    No active orders in your area right now...
                  </p>
                  <p className="text-gray-400 font-medium text-sm mt-1">
                    We'll notify you as soon as an order arrives.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Active Order */}
        {currentOrder && (
          <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full border border-gray-100 flex flex-col gap-6 animate-fadeIn">
            <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
              <span className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-sm animate-pulse">
                📦
              </span> 
              Active Order Route
            </h2>
            
            <div className="border border-orange-100 rounded-2xl p-6 bg-gradient-to-br from-orange-50/50 to-white shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d2d]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10">
                <p className="font-black text-xl text-gray-800 mb-3">
                  {currentOrder?.shopOrder?.shop?.name}
                </p>
                
                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-orange-100/50 shadow-sm mb-4">
                  <FaMapMarkerAlt className="text-[#ff4d2d] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Drop Location</p>
                    <p className="text-sm font-medium text-gray-700">
                      {currentOrder?.devliveryAddress || currentOrder?.deliveryAddress?.text}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-xs font-bold bg-white shadow-sm border border-gray-100 text-gray-700 px-4 py-2 rounded-xl">
                    {currentOrder?.shopOrder?.shopOrderItems?.length || 0} Items
                  </span>
                  <span className="text-sm font-black text-green-600 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-xl">
                    ₹{currentOrder?.shopOrder?.subtotal || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full">
              <DeliveryBoyTracking
                data={currentOrder}
                customerId={currentOrder?.user?._id}
                onDelivered={() => {
                  setCurrentOrder(null);
                  getAssignments();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
