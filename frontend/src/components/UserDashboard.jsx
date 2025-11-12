import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import { FaChevronCircleLeft } from "react-icons/fa";
import { FaChevronCircleRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import FoodCard from "./FoodCard";

export default function UserDashboard() {
  const { currentCity, shopInMyCity, itemsInMyCity } = useSelector(
    (state) => state.user
  );
  const catScrollRef = useRef();
  const shopScrollRef = useRef();
  const [showLeftCateButton, setShowLeftCateButton] = useState(false);
  const [showRightCateButton, setShowRightCateButton] = useState(false);
  const [showRightShopButton, setShowRightShopButton] = useState(false);
  const [showLeftShopButton, setShowLeftShopButton] = useState(false);

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current;
    if (element) {
      setLeftButton(element.scrollLeft > 0);
      setRightButton(
        element.scrollLeft + element.clientWidth < element.scrollWidth
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
          setShowRightCateButton
        );
      };

      element.addEventListener("scroll", handleScroll);

      // Cleanup listener on unmount
      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // Shop scroll useEffect
  useEffect(() => {
    const element = shopScrollRef.current;

    if (element) {
      // Initial check on mount
      updateButton(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );

      const handleScroll = () => {
        updateButton(
          shopScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton
        );
      };

      element.addEventListener("scroll", handleScroll);

      // Cleanup listener on unmount
      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center">
      <Nav />
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
          Best Shop in {currentCity}
        </h1>
        <div className="w-full relative">
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
            {shopInMyCity.map((shop, index) => (
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
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Suggested Food Items
        </h1>

        <div className="w-full h-auto flex flex-wrap gap-[20px] justify-center">
          {itemsInMyCity?.map((item, index) => (
            <FoodCard key={index} data={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
