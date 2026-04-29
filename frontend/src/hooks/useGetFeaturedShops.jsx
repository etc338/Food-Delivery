import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setShopInMyCity } from "../redux/userSlice";

export default function useGetFeaturedShops() {
  const dispatch = useDispatch();
  const { locationBlocked, currentCity } = useSelector((state) => state.user);
  
  useEffect(() => {
    // Only fetch featured shops if location is blocked or no city is set
    if (!locationBlocked && currentCity) return;
    
    const fetchFeaturedShops = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/featured`,
          { withCredentials: true }
        );
        dispatch(setShopInMyCity(result.data));
      } catch (error) {
        console.log("Error fetching featured shops:", error);
      }
    };
    
    fetchFeaturedShops();
  }, [locationBlocked, currentCity, dispatch]);
}
