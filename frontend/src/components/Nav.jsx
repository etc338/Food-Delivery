import React, { useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoSearch, IoCartOutline, IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import axios from "axios";
import { setUserData, setSearchQuery } from "../redux/userSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { LuReceipt } from "react-icons/lu";

export default function Nav() {
  const [showInfo, setShowInfo] = useState(false);
  const { userData, currentCity, cartItems, myOrders, ordersViewed, searchQuery: reduxSearchQuery } = useSelector(
    (state) => state.user,
  );
  const { myShopData } = useSelector((state) => state.owner);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQueryLocal] = useState(reduxSearchQuery || "");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQueryLocal(query);
    dispatch(setSearchQuery(query));
  };
  
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
    <div className="w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] glass-nav overflow-visible transition-all duration-300">
      {showSearch && userData.role == "user" && (
        <div className="flex md:hidden absolute top-[90px] left-[5%] w-[90%] h-[60px] bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl items-center gap-[15px] z-[9998] animate-slideDown border border-gray-100">
          <div className="flex items-center w-[35%] overflow-hidden gap-[8px] px-[15px] border-r-[1px] border-gray-200">
            <FaLocationDot size={20} className="text-[#ff4d2d] shrink-0" />
            <div className="w-[80%] truncate text-sm font-semibold text-gray-700">{currentCity || "City"}</div>
          </div>
          <div className="flex items-center w-[65%] gap-[10px] pr-[15px]">
            <IoSearch size={20} className="text-[#ff4d2d] shrink-0" />
            <input
              type="text"
              placeholder="Search food..."
              value={searchQuery}
              onChange={handleSearch}
              className="text-gray-700 outline-none w-full bg-transparent text-sm font-medium"
            />
          </div>
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] cursor-pointer hover:scale-105 transition-transform duration-300 drop-shadow-sm" onClick={() => navigate("/")}>Vingo</h1>
      
      {userData.role == "user" && (
        <div className="hidden md:flex md:w-[60%] lg:w-[45%] h-[52px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full items-center gap-[20px] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
          <div className="flex items-center w-[35%] overflow-hidden gap-[10px] px-[20px] border-r-[1px] border-gray-200">
            <FaLocationDot size={20} className="text-[#ff4d2d] shrink-0 group-hover:scale-110 transition-transform duration-300" />
            <div className="w-[80%] truncate text-gray-700 font-semibold">{currentCity || "Select City"}</div>
          </div>
          <div className="flex items-center w-[65%] gap-[12px] pr-[20px]">
            <IoSearch size={20} className="text-[#ff4d2d] shrink-0 group-hover:scale-110 transition-transform duration-300" />
            <input
              type="text"
              placeholder="Search for delicious food..."
              value={searchQuery}
              onChange={handleSearch}
              className="text-gray-700 outline-none w-full bg-transparent font-medium"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-5">
        {userData.role == "user" &&
          (showSearch ? (
            <IoClose
              size={28}
              className="text-[#ff4d2d] md:hidden cursor-pointer hover:rotate-90 transition-transform duration-300"
              onClick={() => setShowSearch(false)}
            />
          ) : (
            <IoSearch
              size={26}
              className="text-[#ff4d2d] md:hidden cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => setShowSearch(true)}
            />
          ))}

        {userData.role == "owner" ? (
          <>
            {myShopData && (
              <>
                <button
                  onClick={() => navigate("/add-item")}
                  className="hidden md:flex items-center gap-2 px-4 py-2 cursor-pointer rounded-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white font-bold hover:shadow-lg hover:shadow-[#ff4d2d]/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <FaPlus size={16} />
                  <span>Add Food</span>
                </button>
                <button
                  onClick={() => navigate("/add-item")}
                  className="md:hidden flex items-center p-2.5 cursor-pointer rounded-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <FaPlus size={18} />
                </button>
              </>
            )}

            <div
              onClick={() => navigate("/my-orders")}
              className="hidden md:flex items-center gap-2 px-4 py-2 cursor-pointer rounded-xl bg-orange-50 text-[#ff4d2d] font-bold relative hover:bg-orange-100 transition-colors duration-300 border border-orange-100 hover:shadow-sm"
            >
              <LuReceipt size={20} />
              <span>Orders</span>
              {myOrders?.length > 0 && !ordersViewed && !location.pathname.startsWith("/my-orders") && (
                  <span className="absolute -top-2 -right-2 text-[11px] font-black text-white bg-red-500 rounded-full px-[6px] py-[2px] shadow-sm animate-bounce">
                    New
                  </span>
                )}
            </div>
            <div
              onClick={() => navigate("/my-orders")}
              className="md:hidden flex items-center gap-2 p-2.5 cursor-pointer rounded-xl bg-orange-50 text-[#ff4d2d] font-bold relative hover:bg-orange-100 transition-colors border border-orange-100"
            >
              <LuReceipt size={22} />
              {myOrders?.length > 0 && !ordersViewed && !location.pathname.startsWith("/my-orders") && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse"></span>
                )}
            </div>
          </>
        ) : (
          <>
            {userData.role == "user" && (
              <div
                className="cursor-pointer relative hover:scale-110 transition-transform duration-300 p-1.5"
                onClick={() => navigate("/cart")}
              >
                <IoCartOutline size={30} className="text-[#ff4d2d]" />
                <span className="absolute 0 -top-1 -right-1 text-[11px] font-black text-white bg-[#ff4d2d] rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-md border-[2px] border-white">
                  {cartItems?.length || 0}
                </span>
              </div>
            )}

            <button
              onClick={() => navigate("/my-orders")}
              className="hidden md:block px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ff4d2d] text-sm font-bold transition-all duration-300 border border-orange-100 hover:shadow-sm"
            >
              My Orders
            </button>
          </>
        )}

        <div className="relative">
          <div
            onClick={() => setShowInfo((prev) => !prev)}
            className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-[#ff4d2d] to-[#ff7a55] text-white flex items-center justify-center text-[18px] shadow-md font-bold cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-[2px] border-white ring-2 ring-transparent hover:ring-orange-200"
          >
            {userData.fullName.slice(0, 1)}
          </div>
          
          {showInfo && (
            <div
              className="absolute top-[55px] right-0 w-[200px] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex flex-col gap-1 z-[10000] animate-slideDown border border-gray-100/50"
            >
              <div className="text-[16px] font-black text-gray-800 border-b border-gray-100 pb-3 mb-2 px-2 pt-1">{userData.fullName}</div>
              {userData.role == "user" && (
                <div
                  className="md:hidden text-gray-600 font-bold cursor-pointer hover:text-[#ff4d2d] hover:bg-orange-50 p-2.5 rounded-xl transition-colors duration-200"
                  onClick={() => { navigate("/my-orders"); setShowInfo(false); }}
                >
                  My orders
                </div>
              )}
              <div
                onClick={handleLogOut}
                className="text-red-500 font-bold cursor-pointer hover:bg-red-50 p-2.5 rounded-xl transition-colors duration-200 flex items-center justify-between"
              >
                <span>Log Out</span>
                <span className="text-xl leading-none">→</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
