import React from "react";
import Nav from "./Nav";
import { useDispatch, useSelector } from "react-redux";
import { FaUtensils, FaPen, FaStore, FaPowerOff, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import OwnerItemCard from "./OwnerItemCard";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";

export default function OwnerDashboard() {
  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [toastMessage, setToastMessage] = React.useState(null);

  const toggleStatus = async () => {
    try {
      const { data } = await axios.put(`${serverUrl}/api/shop/toggle-status`, {}, { withCredentials: true });
      dispatch(setMyShopData({ ...myShopData, isOpen: data.isOpen }));
      setToastMessage({ type: 'success', text: data.message });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      setToastMessage({ type: 'error', text: error.response?.data?.message || "Failed to toggle status" });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfaf8] flex flex-col items-center pb-20 relative">
      <Nav />
      
      {/* Custom Toast Message */}
      {toastMessage && (
        <div className={`fixed top-20 right-5 md:right-10 z-[100] px-6 py-3.5 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 animate-fadeIn ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {toastMessage.type === 'error' ? <FaTimesCircle size={20} /> : <FaCheckCircle size={20} />}
          {toastMessage.text}
        </div>
      )}
      
      {!myShopData && (
        <div className="flex justify-center items-center p-6 w-full mt-10 animate-slideUp">
          <div className="w-full max-w-lg bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-10 border border-gray-100 hover:shadow-[0_20px_40px_rgb(255,77,45,0.08)] transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border border-orange-100 group-hover:-translate-y-2 transition-transform duration-500">
                <FaStore className="text-[#ff4d2d] w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
                Partner With Us
              </h2>
              <p className="text-gray-500 mb-8 font-medium text-lg leading-relaxed">
                Join our premium food delivery platform and reach thousands of hungry customers every day.
              </p>
              <button
                onClick={() => navigate("/create-edit-shop")}
                className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
              >
                Register Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {myShopData && (
        <div className="w-full flex flex-col items-center gap-8 px-4 sm:px-6 mt-6 animate-fadeIn">
          
          <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden border border-gray-100 w-full max-w-4xl relative group">
            <div className="relative h-56 sm:h-72 w-full overflow-hidden">
              <img
                src={myShopData.image}
                alt={myShopData.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div
                className="absolute top-6 right-6 flex items-center gap-3 z-20"
              >
                <button
                  onClick={toggleStatus}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg font-bold transition-all duration-300 border hover:-translate-y-1 ${
                    myShopData.isOpen 
                      ? "bg-green-500 hover:bg-green-600 border-green-400 text-white" 
                      : "bg-gray-500 hover:bg-gray-600 border-gray-400 text-white"
                  }`}
                  title={myShopData.isOpen ? "Close Shop" : "Open Shop"}
                >
                  <FaPowerOff />
                  {myShopData.isOpen ? "Shop Open" : "Shop Closed"}
                </button>
                <div
                  className="bg-[#ff4d2d] hover:bg-[#e64528] p-3 text-white rounded-xl shadow-lg cursor-pointer transition-all duration-300 border border-orange-400 flex items-center justify-center hover:-translate-y-1"
                  onClick={() => navigate("/create-edit-shop")}
                  title="Edit Restaurant"
                >
                  <FaPen size={18} />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-10">
                <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 drop-shadow-md tracking-tight">
                  {myShopData.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-white/90 font-medium text-sm sm:text-base">
                  <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                    {myShopData.city}, {myShopData.state}
                  </span>
                  <span className="text-white/70 truncate max-w-md">{myShopData.address}</span>
                </div>
              </div>
            </div>
          </div>

          {myShopData.items.length == 0 ? (
            <div className="flex justify-center items-center p-4 w-full mt-4">
              <div className="w-full max-w-2xl bg-white shadow-sm rounded-[32px] p-10 border border-dashed border-gray-300 hover:border-[#ff4d2d]/50 hover:bg-orange-50/30 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
                    <FaUtensils className="text-[#ff4d2d] w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">
                    Your Menu is Empty
                  </h2>
                  <p className="text-gray-500 mb-8 font-medium">
                    Start adding your delicious signature dishes to attract customers.
                  </p>
                  <button
                    onClick={() => navigate("/add-item")}
                    className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    + Add First Item
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col gap-6 mt-2">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-black text-gray-800">Menu Items</h2>
                <button
                  onClick={() => navigate("/add-item")}
                  className="text-[#ff4d2d] font-bold hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors"
                >
                  + Add New
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myShopData.items.map((item, index) => (
                  <OwnerItemCard key={index} data={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
