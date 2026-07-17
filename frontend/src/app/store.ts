import { configureStore } from "@reduxjs/toolkit";
import { api } from "../features/api.js";
import authReducer from "../features/authSlice.js";
import uiReducer from "../features/uiSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
