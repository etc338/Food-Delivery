import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";

export default function useGetTrendingItems() {
  const dispatch = useDispatch();
  const { locationBlocked, currentCity } = useSelector((state) => state.user);
  
  useEffect(() => {
    // Only fetch trending items if location is blocked or no city is set
    if (!locationBlocked && currentCity) return;
    
    const fetchTrendingItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/trending`,
          { withCredentials: true }
        );
        dispatch(setItemsInMyCity(result.data));
      } catch (error) {
        console.log("Error fetching trending items:", error);
      }
    };
    
    fetchTrendingItems();
  }, [locationBlocked, currentCity, dispatch]);
}
