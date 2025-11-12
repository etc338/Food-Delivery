import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";
import { serverUrl } from "../App";

export default function useUpdateLocation() {
  const dispatch = useDispatch();
 
  useEffect(() => {
   const updateLocation = async (latitude, longitude) => {
    const result = await axios.post(`${serverUrl}/api/user/update-location`, {
      latitude,
      longitude,
    }, { withCredentials: true });
    console.log(result.data.user);
   }
   navigator.geolocation.watchPosition((pos) => {
    updateLocation(pos.coords.latitude, pos.coords.longitude);
   })
  }, []);
}
