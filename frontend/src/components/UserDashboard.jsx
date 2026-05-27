import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import { FaChevronCircleLeft } from "react-icons/fa";
import { FaChevronCircleRight } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import FoodCard from "./FoodCard";
import CitySelector from "./CitySelector";
import LocationErrorModal from "./LocationErrorModal";
import useGetTrendingItems from "../hooks/useGetTrendingItems";
import useGetFeaturedShops from "../hooks/useGetFeaturedShops";
import { useSocket } from "../context/SocketContext";
import { updateShopStatus, updateItemStatus } from "../redux/userSlice";

export default function UserDashboard() {
  const { currentCity, shopInMyCity, itemsInMyCity, locationBlocked, searchQuery } = useSelector(
    (state) => state.user,
  );
  const catScrollRef = useRef();
  const shopScrollRef = useRef();
  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);
  const [showLeftShopButton, setShowLeftShopButton] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const dispatch = useDispatch();
  const socketObj = useSocket();

  // ── REAL-TIME SOCKET LISTENER FOR SHOP STATUS ──
  useEffect(() => {
    if (!socketObj?.current) return;
    const socket = socketObj.current;

    const handleShopStatus = ({ shopId, isOpen }) => {
      dispatch(updateShopStatus({ shopId, isOpen }));
      
      // If the user currently has this shop selected as active, and it just closed, clear it.
      setActiveShop(prev => (prev?.id === shopId && !isOpen) ? null : prev);
    };

    const handleItemStatus = ({ itemId, isAvailable }) => {
      dispatch(updateItemStatus({ itemId, isAvailable }));
    };

    socket.on("shopStatusChanged", handleShopStatus);
    socket.on("itemStatusChanged", handleItemStatus);

    return () => {
      socket.off("shopStatusChanged", handleShopStatus);
      socket.off("itemStatusChanged", handleItemStatus);
    };
  }, [socketObj, dispatch]);

  // Advanced Filter States
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeShop, setActiveShop] = useState(null);  // { id, name }
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Fetch trending items and featured shops when location is blocked
  useGetTrendingItems();
  useGetFeaturedShops();
  
  // Filter items based on search query and advanced filters
  const filteredItems = React.useMemo(() => {
    let items = itemsInMyCity || [];
    
    // 0. Hide items from closed shops globally
    items = items.filter(item => {
      // Find the full shop object to check its isOpen status
      const shopId = typeof item.shop === 'object' ? item.shop?._id : item.shop;
      const shopObj = shopInMyCity?.find(s => s._id === shopId);
      
      // If we found the shop and it is marked as closed (isOpen is exactly false), hide the item
      if (shopObj && shopObj.isOpen === false) return false;
      return true;
    });

    // 1. Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.foodType?.toLowerCase().includes(query)
      );
    }
    
    // 2. Active Shop Filter
    if (activeShop) {
      items = items.filter(item => item.shop?._id?.toString() === activeShop.id || item.shop?.toString() === activeShop.id);
    }
    
    // 3. Active Category Filter
    if (activeCategory) {
      items = items.filter(item => item.category === activeCategory);
    }
    
    // 4. Food Type Filter
    if (filterVeg && !filterNonVeg) {
      items = items.filter(item => item.foodType?.toLowerCase() === "veg");
    } else if (filterNonVeg && !filterVeg) {
      items = items.filter(item => item.foodType?.toLowerCase() === "non veg");
    }
    
    // 5. Sort By
    if (sortBy === "price_low") {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      items = [...items].sort((a, b) => b.price - a.price);
    }
    
    return items;
  }, [itemsInMyCity, searchQuery, activeShop, activeCategory, filterVeg, filterNonVeg, sortBy]);
  
  // Filter shops based on search query
  const filteredShops = React.useMemo(() => {
    if (!searchQuery || !shopInMyCity) return shopInMyCity;
    
    const query = searchQuery.toLowerCase();
    return shopInMyCity.filter(shop => 
      shop.name?.toLowerCase().includes(query) ||
      shop.city?.toLowerCase().includes(query)
    );
  }, [shopInMyCity, searchQuery]);

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current;
    if (element) {
      setLeftButton(element.scrollLeft > 0);
      setRightButton(
        element.scrollLeft + element.clientWidth < element.scrollWidth,
      );
    }
  };

  const scrollHandle = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction == "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const element = catScrollRef.current;

    if (element) {
      setTimeout(() => {
        updateButton(catScrollRef, setShowLeftCateButton, setShowRightCateButton);
      }, 100);

      const handleScroll = () => {
        updateButton(
          catScrollRef,
          setShowLeftCateButton,
          setShowRightCateButton,
        );
      };

      element.addEventListener("scroll", handleScroll);

      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, [categories]);

  // Shop scroll useEffect
  useEffect(() => {
    const element = shopScrollRef.current;

    if (element) {
      setTimeout(() => {
        updateButton(
          shopScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton,
        );
      }, 100);

      const handleScroll = () => {
        updateButton(
          shopScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton,
        );
      };

      element.addEventListener("scroll", handleScroll);

      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, [filteredShops]);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("NOT_SUPPORTED");
      return;
    }
    
    // Request location permission
    navigator.geolocation.getCurrentPosition(
      () => {
        // Success - reload to reinitialize location tracking
        window.location.reload();
      },
      (error) => {
        // Error - show modal with specific error
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("PERMISSION_DENIED");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("POSITION_UNAVAILABLE");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("TIMEOUT");
        } else {
          setLocationError("UNKNOWN");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfaf8] flex flex-col items-center">
      <Nav />
      
      {/* Location Error Modal */}
      {locationError && (
        <LocationErrorModal
          error={locationError}
          onClose={() => setLocationError(null)}
          onRetry={locationError !== "NOT_SUPPORTED" ? handleEnableLocation : null}
        />
      )}
      
      {/* City Selector Modal */}
      {showCitySelector && (
        <CitySelector onClose={() => setShowCitySelector(false)} />
      )}
      
      {/* Location Blocked Warning */}
      {locationBlocked && (
        <div className="w-full max-w-6xl mx-auto p-4 mb-2 mt-4 animate-slideUp">
          <div className="bg-gradient-to-r from-orange-50 to-white border border-[#ff4d2d]/20 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(255,77,45,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d2d]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="flex-shrink-0 w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center border border-orange-100">
                <FaLocationDot size={36} className="text-[#ff4d2d] animate-bounce" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-gray-800 mb-2">
                  Location Access Required
                </h3>
                <p className="text-gray-500 font-medium mb-5 text-sm sm:text-base">
                  We need your location to show nearby restaurants and deliver food to you. 
                  You can enable location access or manually select your city.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={handleEnableLocation}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Enable Location
                  </button>
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="px-6 py-2.5 bg-white text-[#ff4d2d] border-[2px] border-[#ff4d2d] rounded-xl font-bold hover:bg-orange-50 transition-all duration-300"
                  >
                    Select City Manually
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-6xl flex flex-col gap-6 items-start px-4 py-6">
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
          Inspiration for your first order
        </h1>
        <div className="w-full relative group/slider">
          {showLeftCateButton && (
            <button className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#ff4d2d] p-1 rounded-full shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:scale-110 hover:text-orange-600 transition-all duration-300 z-20 border border-gray-100 opacity-0 group-hover/slider:opacity-100">
              <FaChevronCircleLeft size={32} onClick={() => scrollHandle(catScrollRef, "left")} />
            </button>
          )}
          <div className="w-full flex overflow-x-auto gap-5 pb-6 pt-2 scrollbar-hide px-1" ref={catScrollRef}>
            {categories.map((cate, index) => (
              <CategoryCard 
                key={index} 
                name={cate.category} 
                image={cate.image} 
                isActive={activeCategory === cate.category}
                onClick={() => setActiveCategory(activeCategory === cate.category ? null : cate.category)}
              />
            ))}
          </div>
          {showRightCateButton && (
            <button className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#ff4d2d] p-1 rounded-full shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:scale-110 hover:text-orange-600 transition-all duration-300 z-20 border border-gray-100 opacity-0 group-hover/slider:opacity-100">
              <FaChevronCircleRight size={32} onClick={() => scrollHandle(catScrollRef, "right")} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-6 items-start px-4 py-2">
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
          {searchQuery ? `Search Results for "${searchQuery}"` : locationBlocked ? "Featured Shops" : `Best Shop in ${currentCity || "your area"}`}
        </h1>
        <div className="w-full relative group/slider">
          {filteredShops && filteredShops.length > 0 ? (
            <>
              {showLeftShopButton && (
                <button className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#ff4d2d] p-1 rounded-full shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:scale-110 hover:text-orange-600 transition-all duration-300 z-20 border border-gray-100 opacity-0 group-hover/slider:opacity-100">
                  <FaChevronCircleLeft size={32} onClick={() => scrollHandle(shopScrollRef, "left")} />
                </button>
              )}
              <div className="w-full flex overflow-x-auto gap-5 pb-6 pt-2 scrollbar-hide px-1" ref={shopScrollRef}>
                {filteredShops.map((shop, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (shop.isOpen !== false) {
                        setActiveShop(activeShop?.id === shop._id ? null : { id: shop._id, name: shop.name });
                      }
                    }}
                    className={`transition-all duration-200 ${shop.isOpen === false ? '' : activeShop?.id === shop._id ? 'ring-2 ring-[#ff4d2d] rounded-[20px] scale-105 cursor-pointer' : 'hover:scale-105 cursor-pointer'}`}
                  >
                    <CategoryCard name={shop.name} image={shop.image} isClosed={shop.isOpen === false} />
                  </div>
                ))}
              </div>
              {showRightShopButton && (
                <button className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md text-[#ff4d2d] p-1 rounded-full shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:scale-110 hover:text-orange-600 transition-all duration-300 z-20 border border-gray-100 opacity-0 group-hover/slider:opacity-100">
                  <FaChevronCircleRight size={32} onClick={() => scrollHandle(shopScrollRef, "right")} />
                </button>
              )}
            </>
          ) : (
            <div className="w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
              <p className="text-gray-400 font-bold text-lg mb-6">
                {searchQuery 
                  ? `No shops found for "${searchQuery}"`
                  : locationBlocked 
                    ? "Loading featured shops..." 
                    : "No shops available in your area yet"}
              </p>
              {locationBlocked && !searchQuery && (
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="px-8 py-3 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  Select Your City
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-6 items-start px-4 py-6 mb-10">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            {searchQuery ? "Food Items" : locationBlocked ? "Trending Food Items" : activeShop ? `${activeShop.name} Menu` : activeCategory ? `${activeCategory} Items` : "Suggested Food Items"}
          </h1>
          
          {/* Active shop pill with clear button */}
          {activeShop && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-full text-sm font-bold text-[#ff4d2d] shadow-sm">
              <span>🏪 Showing: {activeShop.name}</span>
              <button
                onClick={() => setActiveShop(null)}
                className="w-5 h-5 bg-[#ff4d2d] text-white rounded-full flex items-center justify-center text-[10px] hover:bg-orange-600 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Veg / Non-Veg Toggle */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <button 
                onClick={() => { setFilterVeg(!filterVeg); setFilterNonVeg(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterVeg ? 'bg-green-50 text-green-700 border-green-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <div className="w-3 h-3 border-2 border-green-600 flex items-center justify-center p-0.5"><div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div></div>
                Veg
              </button>
              <button 
                onClick={() => { setFilterNonVeg(!filterNonVeg); setFilterVeg(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterNonVeg ? 'bg-red-50 text-red-700 border-red-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <div className="w-3 h-3 border-2 border-red-600 flex items-center justify-center p-0.5"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div></div>
                Non-Veg
              </button>
            </div>
            
            {/* Sort Dropdown */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 shadow-sm focus:outline-none focus:border-[#ff4d2d] focus:ring-2 focus:ring-[#ff4d2d]/20 transition-all cursor-pointer"
            >
              <option value="default">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="w-full h-auto flex flex-wrap gap-[25px] justify-center md:justify-start">
          {filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <FoodCard key={index} data={item} />
            ))
          ) : (
            <div className="w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
              <p className="text-gray-400 font-bold text-lg mb-6">
                {searchQuery 
                  ? `No food items found for "${searchQuery}"`
                  : locationBlocked 
                    ? "Loading trending items..." 
                    : "No food items available in your area yet"}
              </p>
              {locationBlocked && !searchQuery && (
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="px-8 py-3 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  Select Your City
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
