import axios from "axios";
import React from "react";
import { FaPen, FaTrashAlt, FaLeaf, FaDrumstickBite } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData, updateOwnerItemStatus } from "../redux/ownerSlice";

export default function OwnerItemCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleDeleteItem = async () => {
    try {
      await axios.delete(`${serverUrl}/api/item/delete/${data._id}`, {
        withCredentials: true,
      });
      const shopResult = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(shopResult.data));
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const result = await axios.put(`${serverUrl}/api/item/toggle-status/${data._id}`, {}, {
        withCredentials: true,
      });
      dispatch(updateOwnerItemStatus({ itemId: data._id, isAvailable: result.data.isAvailable }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 w-full hover:shadow-lg hover:border-orange-100 hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-32 sm:w-40 flex-shrink-0 bg-gray-50 relative overflow-hidden">
        <img src={data.image} alt={data.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm border border-white/50">
           {data.foodType === "Veg" ? (
             <div className="w-3 h-3 border-[2px] border-green-600 flex items-center justify-center rounded-sm">
               <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
             </div>
           ) : (
             <div className="w-3 h-3 border-[2px] border-red-600 flex items-center justify-center rounded-sm">
               <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
             </div>
           )}
        </div>
      </div>
      <div className="flex flex-col justify-between p-4 flex-1">
        <div>
          <h2 className="text-lg font-black text-gray-800 line-clamp-1 group-hover:text-[#ff4d2d] transition-colors">
            {data.name}
          </h2>
          <div className="flex gap-2 mt-1 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              {data.category}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-end border-t border-gray-50 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Price</span>
            <span className="font-black text-gray-800 text-xl leading-none">
              ₹{data.price}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleStatus}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors mr-1 border ${data.isAvailable !== false ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
              title={data.isAvailable !== false ? "Click to mark Out of Stock" : "Click to mark In Stock"}
            >
              {data.isAvailable !== false ? 'In Stock' : 'Out of Stock'}
            </button>
            <button
              onClick={() => navigate(`/edit-item/${data._id}`)}
              className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-500 transition-colors"
              title="Edit Item"
            >
              <FaPen size={14} />
            </button>
            <button
              onClick={handleDeleteItem}
              className="p-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              title="Delete Item"
            >
              <FaTrashAlt size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
