"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Usb, WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

// Web Serial API types
declare global {
  interface Navigator {
    serial: {
      requestPort: () => Promise<any>;
      getPorts: () => Promise<any[]>;
    };
  }
}

interface DeviceConnectionProps {
  onConnected: (connection: any) => void;
  onDisconnected: () => void;
  onDataReceived: (data: any) => void;
  onConfigReceived: (config: any) => void;
}

export function DeviceConnection({
  onConnected,
  onDisconnected,
  onDataReceived,
  onConfigReceived,
}: DeviceConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);

  // Biến để theo dõi trạng thái nhận cấu hình
  const configDataRef = useRef<any>({});
  const isReceivingConfigRef = useRef<boolean>(false);

  // Check if Web Serial API is supported
  const isSerialSupported =
    typeof navigator !== "undefined" && "serial" in navigator;

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemoMode(
        window.location.hostname !== "localhost" &&
          (window.location.hostname.includes("vercel.app") ||
            window.location.hostname.includes("netlify.app"))
      );
    }
  }, []);

  // Connect to the device
  const connectToDevice = async () => {
    if (!isSerialSupported) {
      setError("Web Serial API không được hỗ trợ trong trình duyệt này");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Check if we're in a preview/development environment
      const isPreviewMode =
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("netlify.app");

      if (isPreviewMode) {
        // Simulate connection for preview mode
        setTimeout(() => {
          setIsConnected(true);

          // Tạo đối tượng kết nối mô phỏng
          const simulatedConnection = {
            readConfiguration: async () => {
              // Mô phỏng đọc cấu hình
              setTimeout(() => {
                onConfigReceived({
                  message: "Cứu tôi với tôi đang ở {GPS}",
                  phones: ["0987654321", "0123456789"],
                });
              }, 1000);
            },
            updateMessageTemplate: async (message: string) => {
              // Mô phỏng cập nhật tin nhắn
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            clearPhoneNumbers: async () => {
              // Mô phỏng xóa số điện thoại
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            addPhoneNumber: async (phone: string) => {
              // Mô phỏng thêm số điện thoại
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
          };

          onConnected(simulatedConnection);

          // Simulate data for demo purposes
          simulateDeviceData();
        }, 1500);
        return;
      }

      // For production environments, try to use the actual Web Serial API
      try {
        // Request port access
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        portRef.current = port;

        // Set up the reader
        const reader = port.readable?.getReader();
        readerRef.current = reader;

        // Set up the writer
        const writer = port.writable?.getWriter();
        writerRef.current = writer;

        setIsConnected(true);

        // Tạo đối tượng kết nối thực
        const realConnection = {
          readConfiguration: async () => {
            await sendCommand("GET_CONFIG");
          },
          updateMessageTemplate: async (message: string) => {
            await sendCommand(`SET_MESSAGE:${message}`);
          },
          clearPhoneNumbers: async () => {
            // Không có lệnh xóa tất cả, nên chúng ta sẽ không làm gì ở đây
            return Promise.resolve();
          },
          addPhoneNumber: async (phone: string) => {
            await sendCommand(`ADD_PHONE:${phone}`);
          },
        };

        onConnected(realConnection);

        // Start reading data
        readData();

        // Vào chế độ cấu hình
        await sendCommand("CONFIG");
      } catch (err: any) {
        if (
          err.name === "SecurityError" ||
          err.message?.includes("permissions policy")
        ) {
          setError(
            "Quyền truy cập Serial bị từ chối. Vui lòng sử dụng Chrome/Edge trên HTTPS hoặc localhost."
          );

          // Offer to use demo mode
          if (
            confirm(
              "Bạn có muốn sử dụng chế độ demo để xem trước chức năng không?"
            )
          ) {
            setIsConnected(true);

            // Tạo đối tượng kết nối mô phỏng
            const simulatedConnection = {
              readConfiguration: async () => {
                // Mô phỏng đọc cấu hình
                setTimeout(() => {
                  onConfigReceived({
                    message: "Cứu tôi với tôi đang ở {GPS}",
                    phones: ["0987654321", "0123456789"],
                  });
                }, 1000);
              },
              updateMessageTemplate: async (message: string) => {
                // Mô phỏng cập nhật tin nhắn
                return new Promise((resolve) => setTimeout(resolve, 1000));
              },
              clearPhoneNumbers: async () => {
                // Mô phỏng xóa số điện thoại
                return new Promise((resolve) => setTimeout(resolve, 1000));
              },
              addPhoneNumber: async (phone: string) => {
                // Mô phỏng thêm số điện thoại
                return new Promise((resolve) => setTimeout(resolve, 500));
              },
            };

            onConnected(simulatedConnection);
            simulateDeviceData();
          }
        } else {
          throw err; // Re-throw other errors
        }
      }
    } catch (err) {
      console.error("Error connecting to device:", err);
      setError(
        err instanceof Error ? err.message : "Lỗi kết nối không xác định"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }

      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current.releaseLock();
        writerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setIsConnected(false);
      onDisconnected();
    } catch (err) {
      console.error("Error disconnecting from device:", err);
    }
  };

  // Send command to the device
  const sendCommand = async (command: string) => {
    if (!writerRef.current) return;

    const encoder = new TextEncoder();
    await writerRef.current.write(encoder.encode(command + "\n"));
  };

  // Read data from the device
  const readData = async () => {
    if (!readerRef.current) return;

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await readerRef.current.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        if (lines.length > 1) {
          buffer = lines.pop() || "";

          for (const line of lines) {
            processLine(line.trim());
          }
        }
      }
    } catch (err) {
      console.error("Error reading data:", err);
      if (isConnected) {
        disconnectFromDevice();
      }
    }
  };

  // Process a line of data from the device
  const processLine = (line: string) => {
    if (!line) return;

    try {
      // Xử lý dữ liệu cấu hình
      if (line === "BEGIN_CONFIG") {
        configDataRef.current = {};
        isReceivingConfigRef.current = true;
        return;
      } else if (line === "END_CONFIG") {
        isReceivingConfigRef.current = false;
        onConfigReceived(configDataRef.current);
        return;
      } else if (isReceivingConfigRef.current) {
        if (line.startsWith("MESSAGE:")) {
          configDataRef.current.message = line.substring(8);
        } else if (line.startsWith("PHONE_COUNT:")) {
          const count = Number.parseInt(line.substring(12));
          configDataRef.current.phoneCount = count;
          configDataRef.current.phones = [];
        } else if (line.match(/^PHONE_\d+:/)) {
          const parts = line.split(":");
          const index = Number.parseInt(parts[0].substring(6));
          const phone = parts[1];

          if (!configDataRef.current.phones) {
            configDataRef.current.phones = [];
          }

          configDataRef.current.phones[index] = phone;
        }
        return;
      }

      // Parse data from the Arduino output format
      const data: any = {};

      if (line.includes("Khoang cach:")) {
        const match = line.match(/Khoang cach: (\d+\.?\d*) cm/);
        if (match) {
          data.distance = Number.parseFloat(match[1]);
        }
      }

      if (line.includes(">> Co mua!")) {
        data.isRaining = 0;
      } else if (line.includes(">> Khong mua.")) {
        data.isRaining = 1;
      }

      if (line.includes("Toa do:")) {
        const match = line.match(/Toa do: (-?\d+\.?\d*), (-?\d+\.?\d*)/);
        if (match) {
          data.gps = {
            lat: Number.parseFloat(match[1]),
            lng: Number.parseFloat(match[2]),
          };
        }
      }

      if (Object.keys(data).length > 0) {
        onDataReceived(data);
      }
    } catch (err) {
      console.error("Error processing data:", err, line);
    }
  };

  // Add this new function to simulate device data
  const simulateDeviceData = () => {
    // Initial simulated data
    let simulatedDistance = 120;
    let simulatedIsRaining = false;
    let simulatedLat = 21.028511;
    let simulatedLng = 105.804817;

    // Send initial data
    onDataReceived({
      distance: simulatedDistance,
      isRaining: simulatedIsRaining ? 0 : 1,
      gps: { lat: simulatedLat, lng: simulatedLng },
    });

    // Update data periodically
    const dataInterval = setInterval(() => {
      if (!isConnected) {
        clearInterval(dataInterval);
        return;
      }

      // Randomly change values to simulate real data
      simulatedDistance = Math.max(
        10,
        Math.min(200, simulatedDistance + (Math.random() - 0.5) * 20)
      );

      // Thỉnh thoảng giảm khoảng cách xuống dưới 50cm để kích hoạt cảnh báo
      if (Math.random() < 0.2) {
        simulatedDistance = Math.max(10, Math.min(49, simulatedDistance * 0.5));
      }

      // Occasionally change rain status (10% chance)
      if (Math.random() < 0.1) {
        simulatedIsRaining = !simulatedIsRaining;
      }

      // Slightly change GPS coordinates
      simulatedLat += (Math.random() - 0.5) * 0.0001;
      simulatedLng += (Math.random() - 0.5) * 0.0001;

      // Send the simulated data
      onDataReceived({
        distance: simulatedDistance,
        isRaining: simulatedIsRaining ? 0 : 1,
        gps: { lat: simulatedLat, lng: simulatedLng },
      });
    }, 1000); // Cập nhật mỗi giây

    // Clean up interval on disconnect
    return () => clearInterval(dataInterval);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromDevice();
      }
    };
  }, [isConnected]);

  return (
    <div className="space-y-4">
      {!isSerialSupported && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>
                Trình duyệt của bạn không hỗ trợ Web Serial API. Vui lòng sử
                dụng Chrome hoặc Edge.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button
          onClick={isConnected ? disconnectFromDevice : connectToDevice}
          disabled={isConnecting}
          variant={isConnected ? "destructive" : "default"}
          size="lg"
          className="w-full sm:w-auto py-6 text-base transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang kết nối...
            </>
          ) : isConnected ? (
            <>
              <WifiOff className="mr-2 h-5 w-5" />
              Ngắt kết nối
            </>
          ) : (
            <>
              <Usb className="mr-2 h-5 w-5" />
              Kết nối thiết bị
            </>
          )}
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge
            variant={isConnected ? "success" : "outline"}
            className={`px-3 py-1.5 text-sm ${
              isConnected ? "bg-green-500 animate-pulse" : ""
            }`}
          >
            {isConnected ? (
              <span className="flex items-center">
                <Wifi className="mr-1.5 h-3.5 w-3.5" />
                Đã kết nối
              </span>
            ) : (
              <span className="flex items-center">
                <WifiOff className="mr-1.5 h-3.5 w-3.5" />
                Chưa kết nối
              </span>
            )}
          </Badge>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {isConnected && isDemoMode && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            Đang chạy ở chế độ demo. Dữ liệu được mô phỏng cho mục đích xem
            trước.
          </p>
        </div>
      )}
    </div>
  );
}
