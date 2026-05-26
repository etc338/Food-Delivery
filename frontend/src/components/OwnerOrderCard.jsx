import React, { useState, useEffect } from "react";
import { MdPhone } from "react-icons/md";
import { serverUrl } from "../App";
import axios from "axios";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useSocket } from "../context/SocketContext";

export default function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const [localStatus, setLocalStatus] = useState(data?.shopOrders?.status || "");
  const [assignedBoy, setAssignedBoy] = useState(data.shopOrders?.assignedDeliveryBoy || null);
  const dispatch = useDispatch();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setLocalStatus(status);
      }
    };

    const handleOrderAssigned = ({ orderId, assignedBoy }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setAssignedBoy(assignedBoy);
      }
    };

    const handleDeliveryBoyBusy = ({ boyId }) => {
      setAvailableBoys((prev) => prev.filter((b) => b.id?.toString() !== boyId?.toString() && b._id?.toString() !== boyId?.toString()));
    };

    const handleDeliveryBoyFree = () => {
      if (localStatus === "Out Of Delivery" && !assignedBoy) {
        if (!data?.shopOrders?.shop?._id) return;
        axios
          .get(`${serverUrl}/api/order/get-assignment-boys/${data._id}/${data.shopOrders.shop._id}`, {
            withCredentials: true,
          })
          .then((res) => {
            if (res.data?.availableBoys) {
              setAvailableBoys(res.data.availableBoys);
            }
          })
          .catch(() => {});
      }
    };

    const handleDeliveryTimeout = ({ orderId, shopId }) => {
      if (orderId === data._id) {
        alert(`Timeout! No delivery boys accepted Order #${orderId.slice(-6)}. You may need to cancel or re-assign.`);
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);
    socket.on("order:assigned", handleOrderAssigned);
    socket.on("delivery_boy_busy", handleDeliveryBoyBusy);
    socket.on("delivery_boy_free", handleDeliveryBoyFree);
    socket.on("delivery_timeout", handleDeliveryTimeout);
    return () => {
      socket.off("order:status_updated", handleStatusUpdate);
      socket.off("order:assigned", handleOrderAssigned);
      socket.off("delivery_boy_busy", handleDeliveryBoyBusy);
      socket.off("delivery_boy_free", handleDeliveryBoyFree);
      socket.off("delivery_timeout", handleDeliveryTimeout);
    };
  }, [socketRef?.current, data._id, localStatus, assignedBoy]);

  // When the order already has "Out Of Delivery" status on page load,
  // availableBoys is empty because the list only populated on dropdown click.
  // Fix: re-call the same update-status endpoint to get the list of boys
  // who were originally broadcast for this order.
  useEffect(() => {
    if (localStatus === "Out Of Delivery" && availableBoys.length === 0) {
      if (!data?.shopOrders?.shop?._id) return;
      axios
        .get(`${serverUrl}/api/order/get-assignment-boys/${data._id}/${data.shopOrders.shop._id}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data?.availableBoys?.length > 0) {
            setAvailableBoys(res.data.availableBoys);
          }
        })
        .catch(() => {});
    }
  }, [localStatus]);

  const handleUpdateStatus = async (orderId, shopId, status) => {
    if (!status) return;
    try {
      const result = await axios.put(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true },
      );
      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setLocalStatus(status);
      if (result.data?.availableBoys?.length > 0) {
        setAvailableBoys(result.data.availableBoys);
      }
    } catch (error) {
      console.log("Error updating status:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{data.user?.fullName || "Unknown Customer"}</h2>
        <p className="text-sm text-gray-500">{data.user?.email || "No email"}</p>
        <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <MdPhone />
          <span>{data.user?.mobile || "No mobile"}</span>
        </p>
      </div>
      <div className="flex-col flex items-start gap-2 text-gray-600 text-sm">
        <p>{data.deliveryAddress?.text || "No address"}</p>
        <p className="text-xs text-gray-500">Date: {formatDate(data.createdAt)}</p>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {data.shopOrders?.shopOrderItems?.map((item, index) => (
          <div key={index} className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white">
            <img src={item.image} alt="" className="w-full h-24 object-cover rounded" />
            <p className="text-sm font-semibold mt-1">{item.name}</p>
            <p className="text-xs text-gray-500">
              Qty: {item.quantity} x ₹{item.price}
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
        <span className="text-sm">
          status:{" "}
          <span className="font-semibold capitalize text-[#ff4d2d]">{localStatus}</span>
        </span>

        {localStatus !== "delivered" && localStatus !== "Cancelled" && localStatus !== "cancelled" && (
          <select
            onChange={(e) =>
              handleUpdateStatus(data._id, data.shopOrders?.shop?._id, e.target.value)
            }
            className="rounded-md border border-[#ff4d2d] px-3 py-1 text-sm focus:outline-none focus:ring-2"
            value={localStatus}
          >
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="Out Of Delivery">Out Of Delivery</option>
            <option value="Cancelled">Reject/Cancel</option>
          </select>
        )}
      </div>

      {localStatus === "Out Of Delivery" && (
        <div className="mt-3 p-3 border rounded-lg text-sm bg-orange-50">
          <p className="font-semibold mb-2">
            {assignedBoy
              ? "✅ Assigned Delivery Boy:"
              : "🔍 Available Delivery Boys:"}
          </p>

          {assignedBoy ? (
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <p className="font-medium">{assignedBoy.fullName}</p>
              <p className="text-gray-600">{assignedBoy.mobile}</p>
            </div>
          ) : availableBoys?.length > 0 ? (
            <div className="space-y-2">
              {availableBoys.map((b, i) => (
                <div key={i} className="bg-blue-50 p-2 rounded border border-blue-200">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-gray-600">{b.mobile}</p>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">⏳ Waiting for one of them to accept...</p>
            </div>
          ) : (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
              <p className="text-gray-700">⏳ Searching for nearby delivery partners...</p>
              <p className="text-xs text-gray-500 mt-1">
                Delivery boys within 5km will be notified.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-2 border-t pt-3">
        <div className="text-xs text-gray-500">
          Customer Paid: ₹{data.totalAmount || "N/A"}
        </div>
        <div className="text-right font-bold text-green-700 text-sm bg-green-50 px-3 py-1 rounded-md border border-green-200">
          Your Earnings: ₹{data.shopOrders.subtotal}
        </div>
      </div>
    </div>
  );
}
