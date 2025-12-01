import React from "react";
import { MdPhone } from "react-icons/md";
import { serverUrl } from "../App";
import axios from "axios";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useState } from "react";

export default function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const dispatch = useDispatch();
  const handleUpdateStatus = async (orderId, shopId, status) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true }
      );
      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setAvailableBoys(result.data.availableBoys);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {data.user.fullName}
        </h2>
        <p className="text-sm text-gray-500">{data.user.email}</p>
        <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <MdPhone />
          <span>{data.user.mobile}</span>
        </p>
      </div>
      <div className="flex-col flex items-start gap-2 text-gray-600 text-sm">
        <p>{data.deliveryAddress.text}</p>
        <p className="text-xs text-gray-500">
          Lat: {data.deliveryAddress.latitude}, Lon:{" "}
          {data.deliveryAddress.longitude}
        </p>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {data.shopOrders.shopOrderItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
          >
            <img
              src={item.image}
              alt=""
              className="w-full h-24 object-cover rounded"
            />
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
          <span className="font-semibold capitalize text-[#ff4d2d]">
            {data.shopOrders.status}
          </span>
        </span>

        <select
          onChange={(e) =>
            handleUpdateStatus(
              data._id,
              data.shopOrders.shop._id,
              e.target.value
            )
          }
          className="rounded-md border border-[#ff4d2d] px-3 py-1 text-sm focus:outline-none focus:ring-2"
        >
          <option value="">Change</option>
          <option value="Pending">Pending</option>
          <option value="Preparing">preparing</option>
          <option value="Out Of Delivery">Out Of Delivery</option>
        </select>
      </div>

      {data?.shopOrders?.status === "Out Of Delivery" && (
        <div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50">
          {/* Heading */}
          <p>
            {data?.shopOrders?.assignedDeliveryBoy
              ? "Assigned Delivery Boy:"
              : "Available Delivery Boys:"}
          </p>

          {/* Priority 1: Assigned Delivery Boy */}
          {data?.shopOrders?.assignedDeliveryBoy ? (
            <div>
              {data.shopOrders.assignedDeliveryBoy.fullName} -
              {data.shopOrders.assignedDeliveryBoy.mobile}
            </div>
          ) : /* Priority 2: Available Boys */ availableBoys?.length > 0 ? (
            availableBoys.map((b, i) => (
              <div key={i} className="text-gray-400">
                {b.fullName} - {b.mobile}
              </div>
            ))
          ) : (
            /* Priority 3: Nothing available */
            <div>Waiting for delivery boy to accept</div>
          )}
        </div>
      )}

      <div className="text-right font-bold text-gray-800 text-sm">
        Total: ₹{data.shopOrders.subtotal}
      </div>
    </div>
  );
}
