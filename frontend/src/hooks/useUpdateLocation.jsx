import axios from "axios";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App";

export default function useUpdateLocation() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData || userData.role !== "deliveryBoy") return;
    const updateLocation = async (latitude, longitude) => {
      const result = await axios.post(
        `${serverUrl}/api/user/update-location`,
        {
          latitude,
          longitude,
        },
        { withCredentials: true },
      );
      dispatch(setUserData(result.data.user));
    };
    const watchId = navigator.geolocation.watchPosition((pos) => {
      updateLocation(pos.coords.latitude, pos.coords.longitude);
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userData?.role, userData?._id, dispatch]);
}
