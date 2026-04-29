import axios from "axios";
import React, { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { setOrdersViewed } from "../redux/userSlice";

export default function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  useEffect(() => {
    if (!userData) return;
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(result.data));
        // mark as not viewed when new orders are fetched
        dispatch(setOrdersViewed(false));
        console.log("Fetched orders:", result.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrders();
  }, [userData]);
}
