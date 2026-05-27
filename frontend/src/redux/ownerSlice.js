import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
  name: "owner",
  initialState: {
    myShopData: null,
  },
  reducers: {
    setMyShopData: (state, action) => {
      state.myShopData = action.payload;
    },
    updateOwnerItemStatus: (state, action) => {
      if (state.myShopData && state.myShopData.items) {
        const { itemId, isAvailable } = action.payload;
        const item = state.myShopData.items.find((i) => i._id === itemId);
        if (item) {
          item.isAvailable = isAvailable;
        }
      }
    },
  },
});

export const { setMyShopData, updateOwnerItemStatus } = ownerSlice.actions;
export default ownerSlice.reducer;
