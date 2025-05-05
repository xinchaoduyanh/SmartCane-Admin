"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho context
interface ConnectionContextType {
  isConnected: boolean;
  deviceConnection: any;
  setIsConnected: (value: boolean) => void;
  setDeviceConnection: (connection: any) => void;
}

// Tạo context với giá trị mặc định
const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  deviceConnection: null,
  setIsConnected: () => {},
  setDeviceConnection: () => {},
});

// Hook để sử dụng context
export const useConnection = () => useContext(ConnectionContext);

// Provider component
export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  // Khởi tạo state từ localStorage nếu có
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deviceConnectionState') === 'connected';
    }
    return false;
  });
  
  const [deviceConnection, setDeviceConnection] = useState<any>(null);

  // Lưu trạng thái kết nối vào localStorage khi thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isConnected) {
        localStorage.setItem('deviceConnectionState', 'connected');
      } else {
        localStorage.removeItem('deviceConnectionState');
        setDeviceConnection(null);
      }
    }
  }, [isConnected]);

  // Giá trị context
  const value = {
    isConnected,
    deviceConnection,
    setIsConnected,
    setDeviceConnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};
