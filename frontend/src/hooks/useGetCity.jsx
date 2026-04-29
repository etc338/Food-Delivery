import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

export default function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  useEffect(() => {
    if (!navigator.geolocation) return;
    let watchId = null;
    const handlePosition = async (postition) => {
      const latitude = postition.coords.latitude;
      const longitude = postition.coords.longitude;
      dispatch(setLocation({ lat: latitude, lon: longitude }));
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

    // watch position and update dynamically
    watchId = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => console.log("Geo error", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [userData]);
}
