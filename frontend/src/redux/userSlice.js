import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    isAuthReady: false,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    locationBlocked: false,
    shopInMyCity: null,
    itemsInMyCity: null,
    searchQuery: "",
    cartItems: JSON.parse(localStorage.getItem("cartItems")) || [],
    totalAmount: JSON.parse(localStorage.getItem("totalAmount")) || 0,
    myOrders: [],
    ordersViewed: false,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setIsAuthReady: (state, action) => {
      state.isAuthReady = action.payload;
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },
    setLocationBlocked: (state, action) => {
      state.locationBlocked = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setShopInMyCity: (state, action) => {
      state.shopInMyCity = action.payload;
    },
    updateShopStatus: (state, action) => {
      if (state.shopInMyCity) {
        const { shopId, isOpen } = action.payload;
        const shop = state.shopInMyCity.find((s) => s._id === shopId);
        if (shop) {
          shop.isOpen = isOpen;
        }
      }
    },
    updateItemStatus: (state, action) => {
      if (state.itemsInMyCity) {
        const { itemId, isAvailable } = action.payload;
        const item = state.itemsInMyCity.find((i) => i._id === itemId);
        if (item) {
          item.isAvailable = isAvailable;
        }
      }
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload;
    },
    addToCart: (state, action) => {
      const cartItem = action.payload;
      const existingItem = state.cartItems.find((i) => i.id == cartItem.id);
      if (existingItem) {
        existingItem.quantity += cartItem.quantity;
      } else {
        state.cartItems.push(cartItem);
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.quantity * i.price,
        0,
      );
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((i) => i.id == id);
      if (item) {
        item.quantity = quantity;
      }
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.quantity * i.price,
        0,
      );
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    removeCartItem: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter((i) => i.id != id);
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.quantity * i.price,
        0,
      );
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount));
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
      localStorage.removeItem("cartItems");
      localStorage.removeItem("totalAmount");
    },
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },
    setOrdersViewed: (state, action) => {
      state.ordersViewed = action.payload;
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders];
    },
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find((o) => o._id === orderId);
      if (order.shopOrders && order.shopOrders.shop._id == shopId) {
        order.shopOrders.status = status;
      }
    },
  },
});

export const {
  setUserData,
  setIsAuthReady,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setLocationBlocked,
  setSearchQuery,
  setShopInMyCity,
  updateShopStatus,
  updateItemStatus,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  setOrdersViewed,
  addMyOrder,
  updateOrderStatus,
  clearCart,
} = userSlice.actions;
export default userSlice.reducer;
