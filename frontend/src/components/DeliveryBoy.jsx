import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import DeliveryBoyTracking from "./DeliveryBoyTracking";

export default function DeliveryBoy() {
  const { userData } = useSelector((state) => state.user);
  const [currentOrder, setCurrentOrder] = useState();
  const [avavilableAssignments, setAvavilableAssignments] = useState(null);
  const [locationName, setLocationName] = useState("");
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
        {
          withCredentials: true,
        },
      );
      setCurrentOrder(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const acceptOrder = async (assignmentId) => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        {
          withCredentials: true,
        },
      );
      console.log(result.data);
      await getCurrentOrder();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAssignments();
    getCurrentOrder();
  }, [userData]);

  useEffect(() => {
    // reverse geocode delivery boy location to show readable name
    const fetchLocationName = async () => {
      try {
        const coords = userData?.location?.coordinates;
        if (!coords || !coords.length) return;
        const lat = coords[1];
        const lon = coords[0];
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
    <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center pt-[100px]">
      <Nav />
      <div className="w-full max-w-[800px] flex flex-col gap-6 items-center px-4">
        {/* Header Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-center text-center gap-3 items-center w-full md:w-[90%] border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-orange-400 to-[#ff4d2d]"></div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight mt-2">
            Welcome,{" "}
            <span className="text-[#ff4d2d]">{userData?.fullName}</span>
          </h1>
          <p className="text-gray-500 font-medium bg-orange-50 px-4 py-1.5 rounded-full text-sm mt-1">
            {locationName ? (
              <>
                <span className="font-semibold text-gray-700">Location: </span>
                {locationName}
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-700">Lat: </span>
                {userData?.location?.coordinates?.[1] ?? 0},{" "}
                <span className="font-semibold text-gray-700">Lng: </span>
                {userData?.location?.coordinates?.[0] ?? 0}
              </>
            )}
          </p>
        </div>

        {!currentOrder && (
          <div className="bg-white rounded-2xl p-6 shadow-lg w-full md:w-[90%] border border-orange-100 flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 border-b pb-3">
              <span className="text-2xl">🌍</span> Available Orders nearby
            </h2>

            <div className="space-y-4 w-full">
              {avavilableAssignments?.length > 0 ? (
                avavilableAssignments.map((a, index) => (
                  <div
                    className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all bg-slate-50/50"
                    key={index}
                  >
                    <div className="flex flex-col gap-1 w-full sm:w-[75%]">
                      <p className="text-base font-bold text-gray-800">
                        {a?.shopName}
                      </p>
                      <p className="text-sm text-gray-600 leadng-relaxed line-clamp-2">
                        <span className="font-semibold text-gray-700 mr-1">
                          Delivery to:{" "}
                        </span>
                        {a?.deliveryAddress?.text || a?.deliveryAddress}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">
                          {a?.items?.length || 0} Items
                        </span>
                        <span className="text-xs font-bold text-[#ff4d2d] bg-orange-100 px-2 py-1 rounded-md">
                          ₹{a.subtotal || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => acceptOrder(a.assignmentId)}
                      className="bg-[#ff4d2d] text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-[#e64528] active:scale-95 transition-all w-full sm:w-auto shadow-md shadow-orange-200"
                    >
                      Accept Let's Go
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full flex justify-center py-8">
                  <p className="text-gray-400 font-medium text-center bg-gray-50 px-6 py-3 rounded-xl border border-dashed border-gray-200">
                    📭 No active orders in your area right now...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentOrder && (
          <div className="bg-white rounded-2xl p-6 shadow-lg w-full md:w-[90%] border border-orange-100 flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 border-b pb-3">
              📦 Current Active Order
            </h2>
            <div className="border border-orange-200 rounded-xl p-5 mb-3 bg-orange-50/30">
              <p className="font-bold text-lg text-gray-800 mb-1">
                {currentOrder?.shopOrder?.shop?.name}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold text-gray-700">Drop at: </span>
                {currentOrder?.devliveryAddress ||
                  currentOrder?.deliveryAddress?.text}
              </p>
              <div className="flex gap-2">
                <span className="text-xs font-semibold bg-white border text-gray-700 px-3 py-1 rounded-full">
                  {currentOrder?.shopOrder?.shopOrderItems?.length || 0} Items
                </span>
                <span className="text-xs font-bold text-[#ff4d2d] bg-white border border-orange-200 px-3 py-1 rounded-full">
                  ₹{currentOrder?.shopOrder?.subtotal || 0}
                </span>
              </div>
            </div>

            <div className="w-full border-t pt-4">
              <DeliveryBoyTracking data={currentOrder} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
