import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders, setOrdersViewed } from "../redux/userSlice";
import { useSocket } from "../context/SocketContext";

export default function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const socketRef = useSocket();

  useEffect(() => {
    if (!userData) return;

    // Use a "last viewed at" timestamp instead of a count.
    // This way old orders from previous sessions never re-trigger the badge.
    const lastViewedAt = localStorage.getItem(`lastViewedAt_${userData._id}`);

    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });

        dispatch(setMyOrders(result.data));

        // There is a new (unviewed) order if any order's createdAt is newer
        // than the last time the user visited /my-orders.
        if (lastViewedAt) {
          const hasNew = result.data.some(
            (o) => new Date(o.createdAt).getTime() > parseInt(lastViewedAt)
          );
          dispatch(setOrdersViewed(!hasNew));
        } else {
          // First ever visit — mark all as viewed so badge doesn't spam on sign-in.
          dispatch(setOrdersViewed(true));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchOrders();

    // Owners get real-time new-order notifications via socket.
    const socket = socketRef?.current;
    if (userData.role === "owner" && socket) {
      const handleNewOrder = () => {
        fetchOrders();
        dispatch(setOrdersViewed(false));
      };
      socket.on("new:order", handleNewOrder);
      return () => socket.off("new:order", handleNewOrder);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, socketRef?.current]);
}
