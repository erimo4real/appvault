import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  filter: "all" | "personal" | "client" | "saas" | "archived";
  sort: "updated" | "due" | "name" | "progress";
}

const stored = safeLoad();

const initialState: UiState = {
  sidebarCollapsed: stored.sidebarCollapsed ?? false,
  darkMode: stored.darkMode ?? false,
  filter: stored.filter ?? "all",
  sort: stored.sort ?? "updated",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
      persist(state);
    },
    setFilter(state, action: PayloadAction<UiState["filter"]>) {
      state.filter = action.payload;
      persist(state);
    },
    setSort(state, action: PayloadAction<UiState["sort"]>) {
      state.sort = action.payload;
      persist(state);
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload;
      persist(state);
    }
  }
});

function safeLoad(): Partial<UiState> {
  try {
    return JSON.parse(localStorage.getItem("appvault_ui") ?? "{}") as Partial<UiState>;
  } catch {
    return {};
  }
}

function persist(state: UiState) {
  localStorage.setItem(
    "appvault_ui",
    JSON.stringify({
      sidebarCollapsed: state.sidebarCollapsed,
      darkMode: state.darkMode,
      filter: state.filter,
      sort: state.sort
    })
  );
}

export const { setDarkMode, setFilter, setSidebarCollapsed, setSort } = uiSlice.actions;
export default uiSlice.reducer;
