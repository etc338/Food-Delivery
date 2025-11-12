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
    navigator.geolocation.getCurrentPosition(async (postition) => {
      const latitude = postition.coords.latitude;
      const longitude = postition.coords.longitude;
      dispatch(setLocation({ lat: latitude, lon: longitude }));
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
      );
      dispatch(setCurrentCity(result?.data?.results[0]?.city));
      dispatch(setCurrentState(result?.data?.results[0]?.state));
      dispatch(
        setCurrentAddress(
          result?.data?.results[0]?.address_line2 ||
            result?.data?.results[0]?.address_line1
        )
      );
      dispatch(setAddress(result?.data?.results[0]?.address_line2));
    });
  }, [userData]);
}
