import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { TbCurrentLocation } from "react-icons/tb";
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard, FaTimesCircle } from "react-icons/fa";
import { FaMobileAlt, FaWallet } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import "leaflet/dist/leaflet.css";
import { setAddress, setLocation } from "../redux/mapSlice";
import axios from "axios";
import { serverUrl } from "../App";
import { addMyOrder, clearCart } from "../redux/userSlice";

function RecenterMap({ location }) {
  const map = useMap();
  if (location.lat && location.lon) {
    map.setView([location.lat, location.lon], 16, { animate: true });
  }
  return null;
}

export default function CheckOut() {
  const { location, address } = useSelector((state) => state.map);
  const { cartItems, totalAmount } = useSelector((state) => state.user);
  const [addressInput, setAddressInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const deliveryFee = totalAmount > 500 ? 0 : 40;
  const AmountWithDeliveryFee = totalAmount + deliveryFee;

  const onDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng();
    dispatch(setLocation({ lat: lat, lon: lng }));
    getAddressByLatLang(lat, lng);
  };

  const getAddressByLatLang = async (lat, lng) => {
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`,
      );
      dispatch(setAddress(result?.data?.results[0]?.address_line2));
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(async (postition) => {
      const latitude = postition.coords.latitude;
      const longitude = postition.coords.longitude;
      dispatch(setLocation({ lat: latitude, lon: longitude }));
      getAddressByLatLang(latitude, longitude);
    });
  };

  const getLatLongByAddress = async () => {
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          addressInput,
        )}&apiKey=${apiKey}`,
      );
      const { lat, lon } = result.data.features[0].properties;
      dispatch(setLocation({ lat, lon }));
    } catch (error) {
      console.error("Error fetching lat/lon:", error);
    }
  };

  useEffect(() => {
    setAddressInput(address);
  }, [address]);

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "online") {
      const res = await loadRazorpayScript();
      if (!res) {
        setToastMessage({ type: "error", text: "Razorpay SDK failed to load. Are you online?" });
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      try {
        const orderResult = await axios.post(
          `${serverUrl}/api/order/create-razorpay-order`,
          {
            amount: AmountWithDeliveryFee,
          },
          { withCredentials: true },
        );

        if (!orderResult.data) {
          setToastMessage({ type: "error", text: "Server error. Are you online?" });
          setTimeout(() => setToastMessage(null), 4000);
          return;
        }

        const { amount, id: order_id, currency } = orderResult.data;

        const options = {
          key:
            import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_z37fDtdT8A3e4Y", 
          amount: amount.toString(),
          currency: currency,
          name: "Vingo Delivery",
          description: "Food Order Transaction",
          order_id: order_id,
          handler: async function (response) {
            const data = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyResult = await axios.post(
              `${serverUrl}/api/order/verify-payment`,
              data,
              { withCredentials: true },
            );

            if (verifyResult.data.message === "Payment verified successfully") {
              placeOrderToDB(response.razorpay_payment_id);
            } else {
              setToastMessage({ type: "error", text: "Payment verification failed" });
              setTimeout(() => setToastMessage(null), 4000);
            }
          },
          prefill: {
            name: "Customer",
            email: "customer@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#ff4d2d",
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        console.error("Error creating Razorpay Order:", err);
      }
    } else {
      placeOrderToDB(null);
    }
  };

  const placeOrderToDB = async (paymentId = null) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/place-order`,
        {
          cartItems,
          deliveryAddress: {
            text: addressInput,
            latitude: location.lat,
            longitude: location.lon,
          },
          totalAmount,
          paymentMethod,
          paymentId,
        },
        { withCredentials: true },
      );
      dispatch(addMyOrder(result.data.order));
      dispatch(clearCart());
      navigate("/order-place");
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center pt-8 pb-20 px-4 relative">
      {/* Custom Toast Message replacing alert() */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 animate-slideDown bg-red-500 text-white">
          <FaTimesCircle />
          {toastMessage.text}
        </div>
      )}

      <div className="w-full max-w-[900px] animate-slideUp">
        <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
          <button
            onClick={() => navigate("/cart")}
            className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff4d2d] hover:bg-orange-100 transition-colors"
          >
            <IoArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Checkout Securely
          </h1>
        </div>

        <div className="w-full bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-8 border border-gray-100">
          
          <section className="bg-gray-50/50 rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800 tracking-tight">
              <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <FaLocationDot size={16} className="text-[#ff4d2d]" />
              </span>
              Delivery Location
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#ff4d2d]/10 focus:border-[#ff4d2d] transition-all shadow-sm text-gray-700"
                  placeholder="Enter Your Delivery Address..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                />
                <button
                  onClick={() => getLatLongByAddress()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-50 hover:bg-gray-100 text-gray-600 p-2 rounded-lg transition-colors"
                  title="Search Location"
                >
                  <IoIosSearch size={18} />
                </button>
              </div>

              <button
                onClick={() => getCurrentLocation()}
                className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm transition-colors whitespace-nowrap"
              >
                <TbCurrentLocation size={18} /> Current Location
              </button>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm relative z-0">
              <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                <MapContainer
                  className={"w-full h-full"}
                  center={[location?.lat, location?.lon]}
                  zoom={16}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap location={location} />

                  <Marker
                    position={[location?.lat, location?.lon]}
                    draggable
                    eventHandlers={{ dragend: onDragEnd }}
                  ></Marker>
                </MapContainer>
              </div>
            </div>
          </section>

          <section className="bg-gray-50/50 rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-800 tracking-tight">
              <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <FaWallet size={16} className="text-[#ff4d2d]" />
              </span>
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left cursor-pointer transition-all duration-300 ${
                  paymentMethod === "cod"
                    ? "border-[#ff4d2d] bg-orange-50 shadow-md transform scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => setPaymentMethod("cod")}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 shadow-inner">
                  <MdDeliveryDining className="text-green-600 text-2xl" />
                </span>

                <div>
                  <p className="font-black text-gray-800 text-lg leading-tight">Cash on Delivery</p>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">
                    Pay when your food arrives
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left cursor-pointer transition-all duration-300 ${
                  paymentMethod === "online"
                    ? "border-[#ff4d2d] bg-orange-50 shadow-md transform scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => setPaymentMethod("online")}
              >
                <div className="flex -space-x-2">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 shadow-inner z-10 border border-white">
                    <FaMobileAlt className="text-purple-700 text-xl" />
                  </span>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shadow-inner border border-white">
                    <FaCreditCard className="text-blue-700 text-xl" />
                  </span>
                </div>

                <div className="flex-1">
                  <p className="font-black text-gray-800 text-lg leading-tight">Online Payment</p>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">UPI, Cards, Netbanking</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-gray-50 to-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black mb-4 text-gray-800 tracking-tight">
              Order Summary
            </h2>

            <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm font-medium bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                >
                  <span className="text-gray-700 line-clamp-1 flex-1 pr-4">
                    {item.name} <span className="text-gray-400 font-bold mx-1">×</span> {item.quantity}
                  </span>
                  <span className="font-black text-gray-800 whitespace-nowrap">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <hr className="border-gray-200 my-4" />
            
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>

              <div className="flex justify-between font-bold text-gray-500 text-sm">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? "text-green-500" : ""}>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
              </div>
              
              {deliveryFee > 0 && (
                <p className="text-[10px] text-right font-medium text-gray-400 mt-1">Free delivery on orders above ₹500</p>
              )}
            </div>

            <div className="flex justify-between items-center text-[#ff4d2d] pt-4 mt-4 border-t border-gray-200">
              <span className="text-lg font-bold uppercase tracking-wider">Total</span>
              <span className="text-3xl font-black">₹{AmountWithDeliveryFee}</span>
            </div>
          </section>

          <button
            onClick={() => handlePlaceOrder()}
            className="w-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white py-4 rounded-2xl text-xl font-black shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300"
          >
            {paymentMethod === "cod" ? "Place Order (COD)" : "Pay Securely & Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
