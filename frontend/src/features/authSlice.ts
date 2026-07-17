import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserDto } from "@appvault/shared";

interface AuthState {
  user: UserDto | null;
  bootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  bootstrapped: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserDto | null>) {
      state.user = action.payload;
      state.bootstrapped = true;
    },
    markBootstrapped(state) {
      state.bootstrapped = true;
    },
    logoutLocal(state) {
      state.user = null;
      state.bootstrapped = true;
    }
  }
});

export const { logoutLocal, markBootstrapped, setUser } = authSlice.actions;
export default authSlice.reducer;
