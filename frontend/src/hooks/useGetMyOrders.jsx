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
    
    // Load ordersViewed state from localStorage on mount
    const storedOrdersViewed = localStorage.getItem(`ordersViewed_${userData._id}`);
    const storedOrderCount = localStorage.getItem(`orderCount_${userData._id}`);
    
    if (storedOrdersViewed === "true") {
      dispatch(setOrdersViewed(true));
    }
    
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        
        const previousCount = parseInt(storedOrderCount) || 0;
        const currentCount = result.data.length;
        
        // Check if there are NEW orders by comparing counts
        const hasNewOrders = currentCount > previousCount;
        
        dispatch(setMyOrders(result.data));
        
        // Store the current order count
        localStorage.setItem(`orderCount_${userData._id}`, currentCount.toString());
        
        // Only reset ordersViewed if we have new orders
        if (hasNewOrders) {
          dispatch(setOrdersViewed(false));
          localStorage.setItem(`ordersViewed_${userData._id}`, "false");
        }
        
        console.log("Fetched orders:", result.data);
      } catch (error) {
        console.log(error);
      }
    };
    
    fetchOrders();
    
    // Poll for new orders every 30 seconds for owners
    if (userData.role === "owner") {
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);
}
