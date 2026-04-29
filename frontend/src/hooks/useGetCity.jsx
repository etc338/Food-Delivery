import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setLocationBlocked,
} from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

export default function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  
  useEffect(() => {
    // Check if user has manually selected a city
    const manualCity = localStorage.getItem("manualCity");
    const manualState = localStorage.getItem("manualState");
    
    if (manualCity && manualState) {
      dispatch(setCurrentCity(manualCity));
      dispatch(setCurrentState(manualState));
      dispatch(setLocationBlocked(false));
      return;
    }
    
    if (!navigator.geolocation) {
      dispatch(setLocationBlocked(true));
      return;
    }
    
    let watchId = null;
    
    const handlePosition = async (postition) => {
      const latitude = postition.coords.latitude;
      const longitude = postition.coords.longitude;
      dispatch(setLocation({ lat: latitude, lon: longitude }));
      dispatch(setLocationBlocked(false));
      
      try {
        const result = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
        );
        const res = result?.data?.results?.[0] || {};
        dispatch(setCurrentCity(res.city || res.county || res.state));
        dispatch(setCurrentState(res.state || ""));
        dispatch(
          setCurrentAddress(
            res.address_line2 || res.address_line1 || res.formatted,
          ),
        );
        dispatch(
          setAddress(res.address_line2 || res.address_line1 || res.formatted),
        );
      } catch (error) {
        console.log("Reverse geocode failed", error);
      }
    };

    const handleError = (err) => {
      console.log("Geo error", err);
      if (err.code === err.PERMISSION_DENIED) {
        dispatch(setLocationBlocked(true));
      }
    };

    // watch position and update dynamically
    watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);
}
