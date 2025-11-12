import axios from "axios";
import React from "react";
import { FaPen } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

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
      dispatch(setMyShopData(shopResult.data)); // update Redux with full shop data
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl">
      <div className="w-36 flex-shrink-0 bg-gray-50">
        <img src={data.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col justify-between p-3 flex-1">
        <div>
          <h2 className="text-base font-semibold text-[#ff4d2d]">
            {data.name}
          </h2>
          <p>
            <span className="fonr-medium text-gray-70">Category: </span>
            {data.category}
          </p>
          <p>
            {" "}
            <span className="fonr-medium text-gray-70">Fodd Type: </span>
            {data.foodType}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-[#ff4d2d] font-bold">{data.price}</div>
          <div className="flex items-center gap-2">
            <div
              onClick={() => navigate(`/edit-item/${data._id}`)}
              className="p-2 rounded-full hover:bg-[#ff4d2d]/10 text-[#ff4d2d] cursor-pointer"
            >
              <FaPen size={16} />
            </div>
            <div
              onClick={handleDeleteItem}
              className="p-2 rounded-full hover:bg-[#ff4d2d]/10 text-[#ff4d2d] cursor-pointer"
            >
              <FaTrashAlt size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
