import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface ToastState {
  message: string | null
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { message: null } as ToastState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.message = action.payload
    },
    clearToast(state) {
      state.message = null
    },
  },
})

export const { showToast, clearToast } = toastSlice.actions
export default toastSlice
