// app/client-wrapper.js
"use client";
import { Provider } from 'react-redux';
import { store } from '../redux/store';

export function ClientWrapper({ children }) {
  return <Provider store={store}>{children}</Provider>;
}