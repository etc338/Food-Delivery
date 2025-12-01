import React from "react";
import { useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import { IoCartOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { LuReceipt } from "react-icons/lu";

export default function Nav() {
  const [showInfo, setShowInfo] = useState(false);
  const { userData, currentCity, cartItems } = useSelector(
    (state) => state.user
  );
  const { myShopData } = useSelector((state) => state.owner);
  const [showSearch, setShowSearch] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      navigate("/signin");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] overflow-visible">
      {showSearch && userData.role == "user" && (
        <div className="flex md:hidden fixed top-[80px] left-[5%] w-[90%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px]">
          <div className="flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400">
            <FaLocationDot size={25} className="text-[#ff4d2d]" />
            <div className="w-[80%] truncate text-gray-600">{currentCity}</div>
          </div>
          <div className="flex items-center w-[80%] gap-[10px]">
            <IoSearch size={25} className="text-[#ff4d2d] " />
            <input
              type="text"
              placeholder="search delicious food..."
              className="px-[10px] text-gray-700 outline-0 w-full"
            />
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2 text-[#ff4d2d]">Vingo</h1>
      {userData.role == "user" && (
        <div className="hidden md:flex md:w-[60%] lg:w-[40%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px]">
          <div className="flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400">
            <FaLocationDot size={25} className="text-[#ff4d2d]" />
            <div className="w-[80%] truncate text-gray-600">{currentCity}</div>
          </div>
          <div className="flex items-center w-[80%] gap-[10px]">
            <IoSearch size={25} className="text-[#ff4d2d] " />
            <input
              type="text"
              placeholder="search delicious food..."
              className="px-[10px] text-gray-700 outline-0 w-full"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {userData.role == "user" &&
          (showSearch ? (
            <IoClose
              size={25}
              className="text-[#ff4d2d] md:hidden"
              onClick={() => setShowSearch(false)}
            />
          ) : (
            <IoSearch
              size={25}
              className="text-[#ff4d2d] md:hidden"
              onClick={() => setShowSearch(true)}
            />
          ))}

        {userData.role == "owner" ? (
          <>
            {myShopData && (
              <>
                <button
                  onClick={() => navigate("/add-item")}
                  className="hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]"
                >
                  <FaPlus size={20} />
                  <span>Add Food Item</span>
                </button>
                <button
                  onClick={() => navigate("/add-item")}
                  className="md:hidden flex items-center p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]"
                >
                  <FaPlus size={20} />
                </button>
              </>
            )}

            <div
              onClick={() => navigate("/my-orders")}
              className="hidden md:flex items-center gap-2 px-3 py-1 cursor-pointer rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium relative"
            >
              <LuReceipt size={20} />
              <span>My Orders</span>
              <span className="absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]">
                0
              </span>
            </div>
            <div
              onClick={() => navigate("/my-orders")}
              className="md:hidden flex items-center gap-2 px-3 py-1 cursor-pointer rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium relative"
            >
              <LuReceipt size={20} />
              <span className="absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]">
                0
              </span>
            </div>
          </>
        ) : (
          <>
            {userData.role == "user" && (
              <div
                className="cursor-pointer"
                onClick={() => navigate("/cart")}
              >
                <IoCartOutline size={25} className="text-[#ff4d2d]" />
                <span className="absolute right-[-9px] top-[-12px] text-[#ff4d2d]">
                  {cartItems.length}
                </span>
              </div>
            )}

            <button
              onClick={() => navigate("/my-orders")}
              className="hidden md:block px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium"
            >
              My Orders
            </button>
          </>
        )}

        <div
          onClick={() => setShowInfo((prev) => !prev)}
          className="w-[40px] h-[40px] rounded-full bg-[#ff4d2d] text-white flex items-center justify-center text-[18px] shadow-xl font-semibold cursor-pointer"
        >
          {userData.fullName.slice(0, 1)}
        </div>
        {showInfo && (
          <div className={`fixed top-[80px] right-[10px] ${userData.role == "deliveryBoy" ? "md:right-[20%] lg:right-[40%]" : "md:right-[10%] lg:right-[25%]" } w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]`}>
            <div className="text-[17px] fonr-semibold">{userData.fullName}</div>
            {userData.role == "user" && (
              <div
                className="md:hidden text-[#ff4d2d] font-semibold cursor-pointer"
                onClick={() => navigate("/my-orders")}
              >
                {" "}
                My orders
              </div>
            )}
            <div
              onClick={handleLogOut}
              className="text-[#ff4d2d] font-semibold cursor-pointer"
            >
              {" "}
              Log Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
