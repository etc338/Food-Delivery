import React, { useState, useEffect } from "react";
import UserOrderTracking from "./UserOrderTracking";
import ReviewModal from "./ReviewModal";
import axios from "axios";
import { serverUrl } from "../App";
import { useSocket } from "../context/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";
import { FaBoxOpen, FaCheckCircle, FaTimesCircle, FaStar, FaExclamationCircle } from "react-icons/fa";

export default function UserOrderCard({ data }) {
  const [shopStatuses, setShopStatuses] = useState(() => {
    const statuses = {};
    data.shopOrders?.forEach(so => {
      statuses[so.shop._id] = so.status || "pending";
    });
    return statuses;
  });

  const [trackingShopId, setTrackingShopId] = useState(null);
  const [reviewShopId, setReviewShopId] = useState(null);
  const [shopCanReview, setShopCanReview] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  
  const dispatch = useDispatch();
  const { currentCity, locationBlocked } = useSelector((state) => state.user);

  const socketRef = useSocket();

  const handleCancelOrder = async () => {
    try {
      await axios.put(`${serverUrl}/api/order/cancel-order/${data._id}`, {}, { withCredentials: true });
      const newStatuses = {};
      Object.keys(shopStatuses).forEach(id => newStatuses[id] = "Cancelled");
      setShopStatuses(newStatuses);
      setToastMessage({ type: "success", text: "Order cancelled successfully!" });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      setToastMessage({ type: "error", text: error.response?.data?.message || "Failed to cancel order" });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const canTrack = (status) =>
    ["Out Of Delivery", "picked", "preparing"].includes(status);

  const isDelivered = (status) => status === "delivered" || status === "Delivered";

  const checkCanReview = async (shopId) => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/review/can-review/${data._id}/${shopId}`,
        { withCredentials: true }
      );
      setShopCanReview(prev => ({ ...prev, [shopId]: response.data.canReview }));
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  useEffect(() => {
    data.shopOrders?.forEach(so => {
      if (isDelivered(shopStatuses[so.shop._id])) {
        checkCanReview(so.shop._id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopStatuses]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, shopId, status }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setShopStatuses(prev => ({ ...prev, [shopId]: status }));
        if ((status === "delivered" || status === "Delivered") && trackingShopId === shopId) {
          setTrackingShopId(null);
        }
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);
    return () => socket.off("order:status_updated", handleStatusUpdate);
  }, [socketRef?.current, data._id, trackingShopId]);

  const getStatusColor = (status) => {
    if (!status) return "text-gray-500 bg-gray-100";
    const s = status.toLowerCase();
    if (s === "delivered") return "text-green-600 bg-green-50 border-green-200";
    if (s === "cancelled") return "text-red-500 bg-red-50 border-red-200";
    if (s === "out of delivery") return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-500 bg-orange-50 border-orange-200";
  };

  const allPending = Object.values(shopStatuses).every(s => s.toLowerCase() === "pending");

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6 hover:shadow-lg transition-all duration-300 w-full group relative">
      
      {/* Custom Toast Message replacing alert() */}
      {toastMessage && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 animate-slideDown ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {toastMessage.type === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          {toastMessage.text}
        </div>
      )}

      {reviewShopId && (
        <ReviewModal
          order={data}
          shopId={reviewShopId}
          onClose={() => setReviewShopId(null)}
          onSuccess={async () => {
            setShopCanReview(prev => ({ ...prev, [reviewShopId]: false }));
            setReviewShopId(null);
            try {
              const url = locationBlocked || !currentCity
                ? `${serverUrl}/api/item/trending`
                : `${serverUrl}/api/item/get-by-city/${currentCity}`;
              const res = await axios.get(url, { withCredentials: true });
              dispatch(setItemsInMyCity(res.data));
            } catch (error) {
              console.log("Error refetching items after review:", error);
            }
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FaBoxOpen className="text-gray-400" />
            <p className="font-bold text-gray-800 text-lg">Order #{data?._id?.slice(-6).toUpperCase()}</p>
          </div>
          <p className="text-sm font-medium text-gray-500">{formatDate(data.createdAt)}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</p>
          <span className="font-black text-gray-800">{data.paymentMethod?.toUpperCase()}</span>
        </div>
      </div>

      {data.shopOrders?.map((shopOrder, index) => {
        const currentShopStatus = shopStatuses[shopOrder.shop._id] || shopOrder.status;
        
        return (
          <div key={index} className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-orange-50/50 to-white border border-orange-100/50 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-orange-100/50 pb-3">
              <p className="font-black text-gray-800 text-lg tracking-tight">{shopOrder.shop.name}</p>
              <div className={`inline-block px-3 py-1 rounded-lg border text-sm font-bold capitalize w-fit ${getStatusColor(currentShopStatus)}`}>
                {currentShopStatus}
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-hide">
              {shopOrder.shopOrderItems.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 w-44 rounded-xl p-2.5 bg-white shadow-sm border border-gray-50 group-hover:shadow-md transition-shadow">
                  <div className="w-full h-28 rounded-lg overflow-hidden mb-3">
                    <img src={item.image || item.item?.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm font-black text-[#ff4d2d]">₹{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-t border-orange-100/50 pt-3 gap-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-500 text-sm">Shop Subtotal:</p>
                <p className="font-black text-gray-800">₹{shopOrder.subtotal}</p>
              </div>

              {/* Per-shop action buttons */}
              <div className="flex flex-wrap gap-3">
                {canTrack(currentShopStatus) && (
                  <button
                    onClick={() => setTrackingShopId(trackingShopId === shopOrder.shop._id ? null : shopOrder.shop._id)}
                    className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] hover:shadow-lg hover:-translate-y-0.5 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-[#ff4d2d]/20"
                  >
                    {trackingShopId === shopOrder.shop._id ? "Hide Tracking" : "Track Driver"}
                  </button>
                )}

                {isDelivered(currentShopStatus) && shopCanReview[shopOrder.shop._id] && (
                  <button
                    onClick={() => setReviewShopId(shopOrder.shop._id)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:shadow-lg hover:-translate-y-0.5 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-yellow-500/20"
                  >
                    <FaStar /> Rate Shop
                  </button>
                )}

                {isDelivered(currentShopStatus) && !shopCanReview[shopOrder.shop._id] && shopCanReview[shopOrder.shop._id] !== undefined && (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-bold border border-green-100">
                    <FaCheckCircle /> Reviewed
                  </div>
                )}
              </div>
            </div>

            {trackingShopId === shopOrder.shop._id && canTrack(currentShopStatus) && (
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-slideDown">
                <UserOrderTracking orderId={data._id} shopId={shopOrder.shop._id} />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-gray-100 pt-5 gap-4">
        <div className="flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Amount Paid</p>
          <p className="font-black text-2xl text-gray-900">₹{data.totalAmount}</p>
        </div>
        
        {/* Global Cancel Order if everything is pending */}
        <div className="flex gap-3 flex-wrap w-full sm:w-auto justify-end">
          {allPending && (
            <button
              onClick={handleCancelOrder}
              className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-sm flex items-center gap-2"
            >
              <FaTimesCircle className="text-red-400" /> Cancel Entire Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
