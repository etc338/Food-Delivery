import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import { FaChevronCircleLeft } from "react-icons/fa";
import { FaChevronCircleRight } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { useSelector } from "react-redux";
import FoodCard from "./FoodCard";
import CitySelector from "./CitySelector";
import LocationErrorModal from "./LocationErrorModal";
import useGetTrendingItems from "../hooks/useGetTrendingItems";
import useGetFeaturedShops from "../hooks/useGetFeaturedShops";

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

  // Fetch trending items and featured shops when location is blocked
  useGetTrendingItems();
  useGetFeaturedShops();
  
  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery || !itemsInMyCity) return itemsInMyCity;
    
    const query = searchQuery.toLowerCase();
    return itemsInMyCity.filter(item => 
      item.name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.foodType?.toLowerCase().includes(query)
    );
  }, [itemsInMyCity, searchQuery]);
  
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
      // Initial check on mount
      updateButton(catScrollRef, setShowLeftCateButton, setShowRightCateButton);

      const handleScroll = () => {
        updateButton(
          catScrollRef,
          setShowLeftCateButton,
          setShowRightCateButton,
        );
      };

      element.addEventListener("scroll", handleScroll);

      // Cleanup listener on unmount
      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shop scroll useEffect
  useEffect(() => {
    const element = shopScrollRef.current;

    if (element) {
      // Initial check on mount
      updateButton(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton,
      );

      const handleScroll = () => {
        updateButton(
          shopScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton,
        );
      };

      element.addEventListener("scroll", handleScroll);

      // Cleanup listener on unmount
      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center">
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
        <div className="w-full max-w-6xl mx-auto p-4 mb-6">
          <div className="bg-orange-50 border-2 border-[#ff4d2d] rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <FaLocationDot size={48} className="text-[#ff4d2d]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Location Access Required
                </h3>
                <p className="text-gray-600 mb-4">
                  We need your location to show nearby restaurants and deliver food to you. 
                  You can enable location access or manually select your city.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={handleEnableLocation}
                    className="px-6 py-2 bg-[#ff4d2d] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Enable Location
                  </button>
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="px-6 py-2 bg-white text-[#ff4d2d] border-2 border-[#ff4d2d] rounded-lg font-medium hover:bg-orange-50 transition-colors"
                  >
                    Select City Manually
                  </button>
                  <a
                    href="https://support.google.com/chrome/answer/142065"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
                  >
                    How to Enable?
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Inspiration for your first order
        </h1>
        <div className="w-full relative">
          {showLeftCateButton && (
            <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10">
              <FaChevronCircleLeft
                onClick={() => scrollHandle(catScrollRef, "left")}
              />
            </button>
          )}
          <div
            className="w-full flex overflow-x-auto gap-4 pb-2 "
            ref={catScrollRef}
          >
            {categories.map((cate, index) => (
              <CategoryCard
                key={index}
                name={cate.category}
                image={cate.image}
              />
            ))}
          </div>
          {showRightCateButton && (
            <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10">
              <FaChevronCircleRight
                onClick={() => scrollHandle(catScrollRef, "right")}
              />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          {searchQuery ? `Search Results for "${searchQuery}"` : locationBlocked ? "Featured Shops" : `Best Shop in ${currentCity || "your area"}`}
        </h1>
        <div className="w-full relative">
          {filteredShops && filteredShops.length > 0 ? (
            <>
              {showLeftShopButton && (
                <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10">
                  <FaChevronCircleLeft
                    onClick={() => scrollHandle(shopScrollRef, "left")}
                  />
                </button>
              )}
              <div
                className="w-full flex overflow-x-auto gap-4 pb-2 "
                ref={shopScrollRef}
              >
                {filteredShops.map((shop, index) => (
                  <CategoryCard key={index} name={shop.name} image={shop.image} />
                ))}
              </div>
              {showRightShopButton && (
                <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10">
                  <FaChevronCircleRight
                    onClick={() => scrollHandle(shopScrollRef, "right")}
                  />
                </button>
              )}
            </>
          ) : (
            <div className="w-full bg-white rounded-xl p-8 text-center shadow-md">
              <p className="text-gray-500 text-lg mb-4">
                {searchQuery 
                  ? `No shops found for "${searchQuery}"`
                  : locationBlocked 
                    ? "Loading featured shops..." 
                    : "No shops available in your area yet"}
              </p>
              {locationBlocked && !searchQuery && (
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="px-6 py-2 bg-[#ff4d2d] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Select Your City
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          {searchQuery ? "Food Items" : locationBlocked ? "Trending Food Items" : "Suggested Food Items"}
        </h1>

        <div className="w-full h-auto flex flex-wrap gap-[20px] justify-center">
          {filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <FoodCard key={index} data={item} />
            ))
          ) : (
            <div className="w-full bg-white rounded-xl p-8 text-center shadow-md">
              <p className="text-gray-500 text-lg mb-4">
                {searchQuery 
                  ? `No food items found for "${searchQuery}"`
                  : locationBlocked 
                    ? "Loading trending items..." 
                    : "No food items available in your area yet"}
              </p>
              {locationBlocked && !searchQuery && (
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="px-6 py-2 bg-[#ff4d2d] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
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
