import axios from "axios";
import React, { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

export default function useGetMyShop() {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });
        if (result.data && result.data.shop) {
          dispatch(setMyShopData(result.data.shop));
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchShop();
  }, [dispatch]);
}
