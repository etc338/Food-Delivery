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
    cartItems: [],
    totalAmount: 0,
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
    },
    removeCartItem: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter((i) => i.id != id);
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.quantity * i.price,
        0,
      );
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
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  setOrdersViewed,
  addMyOrder,
  updateOrderStatus,
} = userSlice.actions;
export default userSlice.reducer;
