import React, { useState, useEffect } from "react";
import UserOrderTracking from "./UserOrderTracking";
import ReviewModal from "./ReviewModal";
import axios from "axios";
import { serverUrl } from "../App";
import { useSocket } from "../context/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";

export default function UserOrderCard({ data }) {
  const [showTracking, setShowTracking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [orderStatus, setOrderStatus] = useState(
    data.shopOrders?.[0]?.status || "pending"
  );
  
  const dispatch = useDispatch();
  const { currentCity, locationBlocked } = useSelector((state) => state.user);

  const handleCancelOrder = async () => {
    try {
      await axios.put(`${serverUrl}/api/order/cancel-order/${data._id}`, {}, { withCredentials: true });
      setOrderStatus("Cancelled");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const socketRef = useSocket();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const canTrack = (status) =>
    ["Out Of Delivery", "picked", "preparing"].includes(status);

  const isDelivered = (status) => status === "delivered";

  const checkCanReview = async (status) => {
    if (!isDelivered(status)) return;
    try {
      const response = await axios.get(
        `${serverUrl}/api/review/can-review/${data._id}`,
        { withCredentials: true }
      );
      setCanReview(response.data.canReview);
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  useEffect(() => {
    checkCanReview(orderStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkCanReview(orderStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatus]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setOrderStatus(status);
        if (status === "delivered") {
          setShowTracking(false);
        }
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);
    return () => socket.off("order:status_updated", handleStatusUpdate);
  }, [socketRef?.current, data._id]);

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {showReviewModal && (
        <ReviewModal
          order={data}
          shopId={data.shopOrders?.[0]?.shop?._id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={async () => {
            setCanReview(false);
            setShowReviewModal(false);
            
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

      <div className="flex justify-between border-b pb-2">
        <div>
          <p className="font-semibold">order #{data?._id?.slice(-6)}</p>
          <p className="text-sm text-gray-500">Date: {formatDate(data.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{data.paymentMethod?.toUpperCase()}</p>
          <p className="font-medium text-blue-600">{orderStatus}</p>
        </div>
      </div>

      {data.shopOrders?.map((shopOrder, index) => (
        <div key={index} className="border rounded-lg p-3 bg-[#fffaf7] space-y-3">
          <p className="font-semibold">{shopOrder.shop.name}</p>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {shopOrder.shopOrderItems.map((item, idx) => (
              <div key={idx} className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white">
                <img src={item.image} alt="" className="w-full h-24 object-cover rounded" />
                <p className="text-sm font-semibold mt-1">{item.name}</p>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity} x ₹{item.price}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <p className="font-semibold">SubTotal: ₹{shopOrder.subtotal}</p>
            <span className="text-sm font-medium text-blue-600">{orderStatus}</span>
          </div>

          {showTracking && canTrack(orderStatus) && (
            <div className="mt-4 border-t pt-4">
              <UserOrderTracking orderId={data._id} shopId={shopOrder.shop._id} />
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between items-center border-t pt-2 gap-2">
        <p className="font-semibold">Total: ₹{data.totalAmount}</p>
        <div className="flex gap-2 flex-wrap justify-end">
          {orderStatus?.toLowerCase() === "pending" && (
            <button
              onClick={handleCancelOrder}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel Order
            </button>
          )}

          {canTrack(orderStatus) && (
            <button
              onClick={() => setShowTracking(!showTracking)}
              className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {showTracking ? "Hide Tracking" : "Track Order"}
            </button>
          )}

          {isDelivered(orderStatus) && canReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              ⭐ Rate Order
            </button>
          )}

          {isDelivered(orderStatus) && !canReview && (
            <span className="text-sm text-green-600 font-medium">✓ Reviewed</span>
          )}
        </div>
      </div>
    </div>
  );
}
