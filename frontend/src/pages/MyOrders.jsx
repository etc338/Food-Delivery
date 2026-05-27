import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import DeliveryBoyOrderCard from "../components/DeliveryBoyOrderCard";
import { setOrdersViewed, setMyOrders } from "../redux/userSlice";
import { FaBoxOpen } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";

export default function MyOrders() {
  const { userData, myOrders } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(setOrdersViewed(true));
    if (userData) {
      localStorage.setItem(`lastViewedAt_${userData._id}`, Date.now().toString());
    }
    
    // Always fetch perfectly fresh orders when opening this page
    const fetchFreshOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchFreshOrders();
  }, [dispatch, userData]);

  return (
    <div className="w-full min-h-screen bg-[#fcfaf8] flex flex-col items-center pt-8 pb-20 px-4">
      <div className="w-full max-w-[880px] animate-slideUp">
        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff4d2d] hover:bg-orange-100 transition-colors"
          >
            <IoArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            My Orders
          </h1>
        </div>
        
        {myOrders?.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center border border-gray-100 animate-fadeIn mt-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FaBoxOpen className="text-gray-400 text-4xl opacity-50" />
            </div>
            <p className="text-gray-800 text-2xl font-black mb-2">No Orders Yet</p>
            <p className="text-gray-500 font-medium mb-8">You haven't placed any orders. Go find some delicious food!</p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders?.map((order) =>
              userData.role === "user" ? (
                <UserOrderCard key={order._id} data={order} />
              ) : userData.role === "owner" ? (
                <OwnerOrderCard key={order._id} data={order} />
              ) : userData.role === "deliveryBoy" ? (
                <DeliveryBoyOrderCard key={order._id} data={order} />
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
