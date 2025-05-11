"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Usb, WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useConnection } from "@/contexts/connection-context";

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
  // Sử dụng context thay vì state cục bộ
  const { isConnected, setIsConnected, deviceConnection, setDeviceConnection } = useConnection();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);

  // Biến để theo dõi trạng thái nhận cấu hình
  const configDataRef = useRef<any>({});
  const isReceivingConfigRef = useRef<boolean>(false);

  // Initialize with null to avoid hydration mismatch
  const [isSerialSupported, setIsSerialSupported] = useState<boolean | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Move client-side checks to useEffect to avoid hydration mismatch
  useEffect(() => {
    // Check if Web Serial API is supported (client-side only)
    setIsSerialSupported(typeof navigator !== "undefined" && "serial" in navigator);

    // Check for demo mode (client-side only)
    if (typeof window !== "undefined") {
      setIsDemoMode(
        window.location.hostname !== "localhost" &&
          (window.location.hostname.includes("vercel.app") ||
            window.location.hostname.includes("netlify.app"))
      );

      // Khôi phục kết nối nếu trạng thái được lưu
      const savedState = localStorage.getItem('deviceConnectionState');
      if (savedState === 'connected' && !isConnected) {
        // Tạo kết nối mô phỏng nếu đang ở chế độ demo
        if (window.location.hostname !== "localhost" &&
            (window.location.hostname.includes("vercel.app") ||
             window.location.hostname.includes("netlify.app"))) {

          // Tạo đối tượng kết nối mô phỏng với EEPROM
          // Lưu trữ dữ liệu mô phỏng trong localStorage để giả lập EEPROM
          const simulatedEEPROM = {
            savePhones: (phones: string[]) => {
              localStorage.setItem('simulatedPhones', JSON.stringify(phones));
            },
            loadPhones: (): string[] => {
              const stored = localStorage.getItem('simulatedPhones');
              return stored ? JSON.parse(stored) : ["0987654321", "0123456789"];
            },
            saveMessage: (message: string) => {
              localStorage.setItem('simulatedMessage', message);
            },
            loadMessage: (): string => {
              return localStorage.getItem('simulatedMessage') || "Cứu tôi với tôi đang ở {GPS}";
            }
          };

          // Tạo đối tượng kết nối mô phỏng
          const simulatedConnection = {
            readConfiguration: async () => {
              // Mô phỏng đọc cấu hình từ EEPROM
              setTimeout(() => {
                const phones = simulatedEEPROM.loadPhones();
                const message = simulatedEEPROM.loadMessage();
                onConfigReceived({
                  message: message,
                  phones: phones,
                });
              }, 1000);
            },
            updateMessageTemplate: async (message: string) => {
              // Mô phỏng cập nhật tin nhắn và lưu vào EEPROM
              console.log("Mô phỏng: Cập nhật tin nhắn SOS: " + message);
              simulatedEEPROM.saveMessage(message);
              setTimeout(() => {
                console.log("Cap nhat tin nhan SOS thanh cong!");
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            clearPhoneNumbers: async () => {
              // Mô phỏng xóa tất cả số điện thoại từ EEPROM
              console.log("Mô phỏng: Xóa tất cả số điện thoại");
              simulatedEEPROM.savePhones([]);
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            addPhoneNumber: async (phone: string) => {
              // Mô phỏng thêm số điện thoại vào EEPROM
              console.log("Mô phỏng: Thêm số điện thoại: " + phone);
              const phones = simulatedEEPROM.loadPhones();
              if (!phones.includes(phone)) {
                phones.push(phone);
                simulatedEEPROM.savePhones(phones);
              }

              setTimeout(() => {
                console.log("Them so dien thoai thanh cong!");
                // Cập nhật danh sách số điện thoại mô phỏng
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            deletePhoneNumber: async (index: number) => {
              // Mô phỏng xóa số điện thoại theo index từ EEPROM
              console.log("Mô phỏng: Xóa số điện thoại tại vị trí: " + (index + 1));
              const phones = simulatedEEPROM.loadPhones();
              if (index >= 0 && index < phones.length) {
                phones.splice(index, 1);
                simulatedEEPROM.savePhones(phones);
              }

              setTimeout(() => {
                console.log("Xoa so dien thoai thanh cong!");
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            displayPhoneNumbers: async () => {
              // Mô phỏng hiển thị danh sách số điện thoại từ EEPROM
              console.log("Mô phỏng: Hiển thị danh sách số điện thoại");
              const phones = simulatedEEPROM.loadPhones();

              setTimeout(() => {
                console.log("Danh sach so dien thoai:");
                phones.forEach((phone, index) => {
                  console.log(`${index + 1}. ${phone}`);
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            reloadPhoneNumbers: async () => {
              // Mô phỏng tải lại danh sách từ EEPROM
              setTimeout(() => {
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            }
          };

          setIsConnected(true);
          onConnected(simulatedConnection);
          simulateDeviceData();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Thêm log ở đây
      console.log("Đang chạy ở chế độ thật, sẽ gọi requestPort");

      // Đoạn này phải luôn chạy
      let port;
      try {
        port = await navigator.serial.requestPort();
      } catch (err: any) {
        // Xử lý khi người dùng không chọn cổng
        if (err.name === 'NotFoundError') {
          setError("Không có cổng nào được chọn. Vui lòng chọn một cổng để kết nối.");
          return; // Thoát sớm, không cần throw lỗi
        } else {
          throw err; // Re-throw các lỗi khác
        }
      }

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
          // Gửi lệnh DISPLAY để đọc danh sách số điện thoại từ EEPROM
          await sendCommand("DISPLAY");
          // Đọc cấu hình sẽ được xử lý trong processLine
        },
        updateMessageTemplate: async (message: string) => {
          // Cập nhật tin nhắn SOS - Chưa được hỗ trợ trong mã Arduino hiện tại
          // Sẽ cần cập nhật mã Arduino để hỗ trợ tính năng này
          console.log("Cập nhật tin nhắn SOS không được hỗ trợ trong mã Arduino hiện tại");
          return Promise.resolve();
        },
        clearPhoneNumbers: async () => {
          // Arduino không hỗ trợ xóa tất cả, nên chúng ta sẽ xóa từng số
          // Việc này sẽ được xử lý ở phía frontend
          return Promise.resolve();
        },
        addPhoneNumber: async (phone: string) => {
          // Thêm số điện thoại - Arduino sẽ tự động lưu vào EEPROM
          await sendCommand(`ADD ${phone}`);

          // Đợi một chút để Arduino có thời gian xử lý
          await new Promise(resolve => setTimeout(resolve, 500));

          // Tải lại danh sách từ EEPROM
          await sendCommand("LIST");
        },
        deletePhoneNumber: async (phone: string) => {
          // Xóa số điện thoại theo số điện thoại
          // Arduino sẽ tự động cập nhật EEPROM
          await sendCommand(`DELETE ${phone}`);

          // Đợi một chút để Arduino có thời gian xử lý
          await new Promise(resolve => setTimeout(resolve, 500));

          // Tải lại danh sách từ EEPROM
          await sendCommand("LIST");
        },
        displayPhoneNumbers: async () => {
          // Hiển thị danh sách số điện thoại đã lưu trong EEPROM
          await sendCommand("LIST");
        },
        sendCommand: async (command: string) => {
          // Gửi lệnh trực tiếp đến Arduino
          await sendCommand(command);
        },
        // Thêm phương thức để tải lại danh sách từ EEPROM
        reloadPhoneNumbers: async () => {
          // Xóa danh sách số điện thoại hiện tại
          configDataRef.current = { phones: [] };

          // Gửi lệnh LIST để đọc lại danh sách từ EEPROM
          console.log("Đang gửi lệnh LIST để tải lại danh sách số điện thoại từ EEPROM");
          await sendCommand("LIST");

          // Đặt timeout để đảm bảo đã nhận đủ danh sách số điện thoại
          return new Promise<void>((resolve) => {
            // Đặt timeout để đảm bảo đã nhận đủ danh sách số điện thoại
            setTimeout(() => {
              // Đảm bảo có tin nhắn mặc định nếu chưa có
              if (!configDataRef.current) {
                configDataRef.current = { phones: [] };
              }

              if (!configDataRef.current.message) {
                // Lấy tin nhắn từ localStorage nếu có
                const savedMessage = localStorage.getItem('messageTemplate');
                configDataRef.current.message = savedMessage || "Cứu tôi với tôi đang ở {GPS}";
              }

              // Gửi dữ liệu đến component cha
              onConfigReceived(configDataRef.current);

              console.log("Đã hoàn thành việc tải lại danh sách số điện thoại:", configDataRef.current.phones);
              resolve();
            }, 2000); // Đợi 2 giây để đảm bảo đã nhận đủ danh sách số điện thoại
          });
        }
      };

      // Thêm phương thức để yêu cầu dữ liệu mẫu
      (realConnection as any).requestSampleData = async () => {
        await sendCommand("SAMPLE_DATA");
      };

      // Lưu connection vào context
      setDeviceConnection(realConnection);
      onConnected(realConnection);

      // Start reading data
      readData();

      // Vào chế độ cấu hình
      await sendCommand("CONFIG");

      // Đợi một chút để Arduino có thời gian xử lý
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gửi lệnh LIST để lấy danh sách số điện thoại
      console.log("Đang gửi lệnh LIST để lấy danh sách số điện thoại");
      await sendCommand("LIST");

      // Đợi một chút để Arduino có thời gian xử lý
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gửi lệnh LIST lần nữa để đảm bảo nhận được danh sách
      console.log("Đang gửi lệnh LIST lần thứ hai để đảm bảo nhận được danh sách");
      await sendCommand("LIST");

      // Thiết lập interval để xử lý dữ liệu định kỳ
      const dataProcessInterval = setInterval(() => {
        if (!isConnected) {
          clearInterval(dataProcessInterval);
        }
      }, 1000);

      // Thiết lập interval để gửi lệnh LIST định kỳ
      const listInterval = setInterval(async () => {
        if (!isConnected) {
          clearInterval(listInterval);
          return;
        }

        try {
          // Gửi lệnh LIST để cập nhật danh sách số điện thoại
          await sendCommand("LIST");
          console.log("Đã gửi lệnh LIST định kỳ");
        } catch (err) {
          console.error("Lỗi khi gửi lệnh LIST:", err);
        }
      }, 10000); // Gửi lệnh LIST mỗi 10 giây

      // Lưu interval để có thể xóa khi ngắt kết nối
      (window as any).listInterval = listInterval;

      // Lưu interval để có thể xóa khi ngắt kết nối
      (window as any).dataProcessInterval = dataProcessInterval;
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

          // Tạo đối tượng kết nối mô phỏng với EEPROM
          // Lưu trữ dữ liệu mô phỏng trong localStorage để giả lập EEPROM
          const simulatedEEPROM = {
            savePhones: (phones: string[]) => {
              localStorage.setItem('simulatedPhones', JSON.stringify(phones));
            },
            loadPhones: (): string[] => {
              const stored = localStorage.getItem('simulatedPhones');
              return stored ? JSON.parse(stored) : ["0987654321", "0123456789"];
            },
            saveMessage: (message: string) => {
              localStorage.setItem('simulatedMessage', message);
            },
            loadMessage: (): string => {
              return localStorage.getItem('simulatedMessage') || "Cứu tôi với tôi đang ở {GPS}";
            }
          };

          // Tạo đối tượng kết nối mô phỏng
          const simulatedConnection = {
            readConfiguration: async () => {
              // Mô phỏng đọc cấu hình từ EEPROM
              setTimeout(() => {
                const phones = simulatedEEPROM.loadPhones();
                const message = simulatedEEPROM.loadMessage();
                onConfigReceived({
                  message: message,
                  phones: phones,
                });
              }, 1000);
            },
            updateMessageTemplate: async (message: string) => {
              // Mô phỏng cập nhật tin nhắn và lưu vào EEPROM
              console.log("Mô phỏng: Cập nhật tin nhắn SOS: " + message);
              simulatedEEPROM.saveMessage(message);
              setTimeout(() => {
                console.log("Cap nhat tin nhan SOS thanh cong!");
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            clearPhoneNumbers: async () => {
              // Mô phỏng xóa tất cả số điện thoại từ EEPROM
              console.log("Mô phỏng: Xóa tất cả số điện thoại");
              simulatedEEPROM.savePhones([]);
              return new Promise((resolve) => setTimeout(resolve, 1000));
            },
            addPhoneNumber: async (phone: string) => {
              // Mô phỏng thêm số điện thoại vào EEPROM
              console.log("Mô phỏng: Thêm số điện thoại: " + phone);
              const phones = simulatedEEPROM.loadPhones();
              if (!phones.includes(phone)) {
                phones.push(phone);
                simulatedEEPROM.savePhones(phones);
              }

              setTimeout(() => {
                console.log("Them so dien thoai thanh cong!");
                // Cập nhật danh sách số điện thoại mô phỏng
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            deletePhoneNumber: async (phone: string) => {
              // Mô phỏng xóa số điện thoại theo số điện thoại từ EEPROM
              console.log("Mô phỏng: Xóa số điện thoại: " + phone);
              const phones = simulatedEEPROM.loadPhones();
              const index = phones.indexOf(phone);
              if (index >= 0) {
                phones.splice(index, 1);
                simulatedEEPROM.savePhones(phones);
              }

              setTimeout(() => {
                console.log("Số điện thoại đã được xóa.");
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            displayPhoneNumbers: async () => {
              // Mô phỏng hiển thị danh sách số điện thoại từ EEPROM
              console.log("Mô phỏng: Hiển thị danh sách số điện thoại");
              const phones = simulatedEEPROM.loadPhones();

              setTimeout(() => {
                console.log("Danh sach so dien thoai:");
                phones.forEach((phone, index) => {
                  console.log(`${index + 1}. ${phone}`);
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            },
            reloadPhoneNumbers: async () => {
              // Mô phỏng tải lại danh sách từ EEPROM
              setTimeout(() => {
                onConfigReceived({
                  message: simulatedEEPROM.loadMessage(),
                  phones: simulatedEEPROM.loadPhones()
                });
              }, 500);
              return new Promise((resolve) => setTimeout(resolve, 500));
            }
          };

          // Lưu connection vào context
          setDeviceConnection(simulatedConnection);
          onConnected(simulatedConnection);
          simulateDeviceData();
        }
      } else {
        throw err; // Re-throw other errors
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    try {
      // Xóa interval xử lý dữ liệu
      if ((window as any).dataProcessInterval) {
        clearInterval((window as any).dataProcessInterval);
        (window as any).dataProcessInterval = null;
      }

      // Xóa interval gửi lệnh LIST
      if ((window as any).listInterval) {
        clearInterval((window as any).listInterval);
        (window as any).listInterval = null;
      }

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
      setDeviceConnection(null);
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
            console.log("Serial line:", line);
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

  // Format phone number to +84 format
  const formatToInternational = (phone: string) => {
    // If already in international format, return as is
    if (phone.startsWith('+84')) {
      return phone;
    }

    // If starts with 0, replace with +84
    if (phone.startsWith('0')) {
      return '+84' + phone.substring(1);
    }

    // If starts with 84 (without +), add the + prefix
    if (phone.startsWith('84')) {
      return '+' + phone;
    }

    // If doesn't start with 0, 84 or +84, assume it's missing the prefix and add +84
    return '+84' + phone;
  };

  // Khởi tạo danh sách listeners
  if (!(window as any).lineListeners) {
    (window as any).lineListeners = [];
  }

  // Process a line of data from the device
  const processLine = (line: string) => {
    console.log("Processing line:", line);
    if (!line) return;

    // Gọi tất cả các listeners
    if ((window as any).lineListeners && (window as any).lineListeners.length > 0) {
      for (const listener of (window as any).lineListeners) {
        listener(line);
      }
    }

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

      // Xử lý danh sách số điện thoại từ Arduino
      if (line === "Danh sach so dien thoai:" || line === "Danh sách số điện thoại:") {
        // Bắt đầu nhận danh sách số điện thoại
        console.log("Bắt đầu nhận danh sách số điện thoại");
        configDataRef.current = { phones: [] };
        return;
      } else if (line.match(/^\d+\. /)) {
        // Dòng chứa số điện thoại: "1. 0123456789"
        const phoneMatch = line.match(/^\d+\. (.+)$/);
        if (phoneMatch && phoneMatch[1]) {
          const formattedPhone = formatToInternational(phoneMatch[1]);
          if (!configDataRef.current) {
            configDataRef.current = { phones: [] };
          }
          if (!configDataRef.current.phones) {
            configDataRef.current.phones = [];
          }
          configDataRef.current.phones.push(formattedPhone);
        }
        return;
      } else if (line.match(/^Số điện thoại từ EEPROM: (.+)$/)) {
        // Dòng chứa số điện thoại từ EEPROM: "Số điện thoại từ EEPROM: 0123456789"
        const phoneMatch = line.match(/^Số điện thoại từ EEPROM: (.+)$/);
        if (phoneMatch && phoneMatch[1]) {
          // Định dạng số điện thoại về dạng quốc tế (+84)
          const formattedPhone = formatToInternational(phoneMatch[1]);
          console.log("Phát hiện số điện thoại từ EEPROM:", formattedPhone);
          if (!configDataRef.current) {
            configDataRef.current = { phones: [] };
          }
          if (!configDataRef.current.phones) {
            configDataRef.current.phones = [];
          }
          // Kiểm tra xem số điện thoại đã tồn tại trong danh sách chưa
          if (!configDataRef.current.phones.includes(formattedPhone)) {
            configDataRef.current.phones.push(formattedPhone);
          }
        }
        return;
      } else if (!line.startsWith("Danh sach so dien thoai:") &&
                 !line.startsWith("Danh sách số điện thoại:") &&
                 !line.includes("Khoang cach:") &&
                 !line.includes("Trang thai mua:") &&
                 !line.includes("Toa do:") &&
                 !line.includes("-------------------") &&
                 !line.includes("Cap nhat GPS:") &&
                 !line.includes("Nut duoc nhan") &&
                 !line.includes("Bat lai GPS") &&
                 !line.includes("Dang cho GPS") &&
                 !line.includes("Module SIM") &&
                 !line.includes("Khoi dong") &&
                 !line.includes("Lenh khong hop le") &&
                 !line.includes("Danh sach so dien thoai da day") &&
                 !line.includes("Khong tim thay so") &&
                 !line.includes("Không tìm thấy số điện thoại cần xóa") &&
                 !line.includes("Da them so:") &&
                 !line.includes("Da xoa so:") &&
                 !line.includes("So dien thoai da ton tai") &&
                 line.length > 5 &&
                 (line.startsWith("+84") || line.startsWith("0") || line.match(/^\d{9,12}$/))) {
        // Đây có thể là một số điện thoại từ Arduino
        // Định dạng số điện thoại về dạng quốc tế (+84)
        const formattedPhone = formatToInternational(line);
        console.log("Phát hiện số điện thoại trực tiếp:", formattedPhone);
        if (!configDataRef.current) {
          configDataRef.current = { phones: [] };
        }
        if (!configDataRef.current.phones) {
          configDataRef.current.phones = [];
        }
        // Kiểm tra xem số điện thoại đã tồn tại trong danh sách chưa
        if (!configDataRef.current.phones.includes(formattedPhone)) {
          configDataRef.current.phones.push(formattedPhone);
        }
        return;
      } else if (line === "Cap nhat tin nhan SOS thanh cong!") {
        // Xác nhận cập nhật tin nhắn thành công
        console.log("Cập nhật tin nhắn SOS thành công");
        return;
      } else if (line === "Them so dien thoai thanh cong!") {
        // Xác nhận thêm số điện thoại thành công
        console.log("Thêm số điện thoại thành công");
        // Gửi lệnh LIST để cập nhật danh sách
        setTimeout(() => sendCommand("LIST"), 500);
        return;
      } else if (line === "Xoa so dien thoai thanh cong!") {
        // Xác nhận xóa số điện thoại thành công
        console.log("Xóa số điện thoại thành công");
        // Gửi lệnh LIST để cập nhật danh sách
        setTimeout(() => sendCommand("LIST"), 500);
        return;
      } else if (line === "Số điện thoại đã được thêm.") {
        // Xác nhận thêm số điện thoại thành công (định dạng mới)
        console.log("Thêm số điện thoại thành công (định dạng mới)");
        // Gửi lệnh LIST để cập nhật danh sách
        setTimeout(() => sendCommand("LIST"), 500);
        return;
      } else if (line === "Số điện thoại đã được xóa.") {
        // Xác nhận xóa số điện thoại thành công (định dạng mới)
        console.log("Xóa số điện thoại thành công (định dạng mới)");
        // Gửi lệnh LIST để cập nhật danh sách
        setTimeout(() => sendCommand("LIST"), 500);
        return;
      } else if (line === "Số điện thoại từ EEPROM:") {
        // Bắt đầu nhận số điện thoại từ EEPROM
        if (!configDataRef.current) {
          configDataRef.current = { phones: [] };
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

      // Kiểm tra định dạng "Trang thai mua: Co mua" hoặc "Trang thai mua: Khong mua"
      if (line.includes("Trang thai mua: Co mua")) {
        data.isRaining = 0; // 0 = có mưa (true)
        console.log("Phát hiện mưa!");
      } else if (line.includes("Trang thai mua: Khong mua")) {
        data.isRaining = 1; // 1 = không mưa (false)
        console.log("Không có mưa.");
      }

      // Giữ lại các định dạng cũ để tương thích
      else if (line.includes(">> Co mua!")) {
        data.isRaining = 0; // 0 = có mưa (true)
        console.log("Phát hiện mưa (định dạng cũ)!");
      } else if (line.includes(">> Khong mua.")) {
        data.isRaining = 1; // 1 = không mưa (false)
        console.log("Không có mưa (định dạng cũ).");
      } else if (line.startsWith("isRaining:")) {
        // Xử lý dữ liệu trực tiếp từ Arduino
        const isRainingValue = line.substring(10).trim();
        data.isRaining = isRainingValue === "true" ? 0 : 1;
        console.log("Trạng thái mưa trực tiếp:", isRainingValue);
      }

      // Xử lý dữ liệu GPS từ Arduino
      if (line.includes("Toa do:")) {
        // Kiểm tra định dạng "Toa do: X.XXXXXX, Y.YYYYYY"
        const match = line.match(/Toa do: (-?\d+\.?\d*), (-?\d+\.?\d*)/);
        if (match) {
          data.gps = {
            lat: Number.parseFloat(match[1]),
            lng: Number.parseFloat(match[2]),
          };
        }
        // Kiểm tra định dạng "Lat: X.XXXXXX"
        else if (line.includes("Lat:")) {
          const latMatch = line.match(/Lat: (-?\d+\.?\d*)/);
          if (latMatch) {
            if (!data.gps) data.gps = { lat: 0, lng: 0 };
            data.gps.lat = Number.parseFloat(latMatch[1]);
          }
        }
        // Kiểm tra định dạng "Lng: Y.YYYYYY"
        else if (line.includes("Lng:")) {
          const lngMatch = line.match(/Lng: (-?\d+\.?\d*)/);
          if (lngMatch) {
            if (!data.gps) data.gps = { lat: 0, lng: 0 };
            data.gps.lng = Number.parseFloat(lngMatch[1]);
          }
        }
      }

      // Nếu nhận được danh sách số điện thoại đầy đủ, gửi đến component cha
      // Sử dụng timeout để đảm bảo đã nhận đủ danh sách số điện thoại
      if (line === "Danh sách số điện thoại:" || line === "Danh sach so dien thoai:" || line === "LIST") {
        console.log("Nhận được tiêu đề danh sách số điện thoại");
        // Xóa danh sách số điện thoại hiện tại
        configDataRef.current = { phones: [] };

        // Đặt timeout để gửi danh sách số điện thoại sau khi đã nhận đủ
        setTimeout(() => {
          console.log("Gửi danh sách số điện thoại đến component cha:", configDataRef.current.phones);
          // Đảm bảo có tin nhắn mặc định nếu chưa có
          if (!configDataRef.current.message) {
            // Lấy tin nhắn từ localStorage nếu có
            const savedMessage = localStorage.getItem('messageTemplate');
            configDataRef.current.message = savedMessage || "Cứu tôi với tôi đang ở {GPS}";
          }
          onConfigReceived(configDataRef.current);
        }, 3000); // Đợi 3 giây để đảm bảo đã nhận đủ danh sách số điện thoại
      }

      // Xử lý khi nhận được dấu hiệu kết thúc danh sách
      if (configDataRef.current && configDataRef.current.phones &&
          configDataRef.current.phones.length > 0 &&
          (line.includes("----------------------------") || line === "")) {
        console.log("Nhận được dấu hiệu kết thúc danh sách số điện thoại");
        // Đảm bảo có tin nhắn mặc định nếu chưa có
        if (!configDataRef.current.message) {
          // Lấy tin nhắn từ localStorage nếu có
          const savedMessage = localStorage.getItem('messageTemplate');
          configDataRef.current.message = savedMessage || "Cứu tôi với tôi đang ở {GPS}";
        }

        // Đặt timeout để đảm bảo đã nhận đủ danh sách số điện thoại
        setTimeout(() => {
          onConfigReceived(configDataRef.current);
          configDataRef.current = {};
        }, 500);
      }

      // Xử lý khi không có số điện thoại nào trong danh sách
      if (line === "Danh sách số điện thoại:" && !configDataRef.current) {
        configDataRef.current = { phones: [] };

        // Đặt timeout để đảm bảo đã nhận đủ danh sách số điện thoại
        setTimeout(() => {
          console.log("Không có số điện thoại nào trong danh sách");
          // Đảm bảo có tin nhắn mặc định nếu chưa có
          if (!configDataRef.current.message) {
            // Lấy tin nhắn từ localStorage nếu có
            const savedMessage = localStorage.getItem('messageTemplate');
            configDataRef.current.message = savedMessage || "Cứu tôi với tôi đang ở {GPS}";
          }
          onConfigReceived(configDataRef.current);
          configDataRef.current = {};
        }, 2000);
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
      isRaining: simulatedIsRaining ? 0 : 1, // 0 = có mưa (true), 1 = không mưa (false)
      gps: { lat: simulatedLat, lng: simulatedLng },
    });

    // Gửi dữ liệu mẫu qua processLine để đảm bảo xử lý đúng - theo định dạng của Arduino
    processLine("Khoang cach: " + simulatedDistance + " cm | Trang thai mua: " +
                (simulatedIsRaining ? "Co mua" : "Khong mua"));

    // Gửi dữ liệu GPS theo định dạng của Arduino
    const gpsData = "Toa do:\nLat: " + simulatedLat.toFixed(6) +
                    "\nLng: " + simulatedLng.toFixed(6) +
                    "\nAlt: 100.0m\nSpeed: 0.0km/h\nSat: 8";
    processLine("Cap nhat GPS:");
    processLine(gpsData);
    processLine("-------------------");

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

      // Gửi dữ liệu qua processLine để đảm bảo xử lý đúng - theo định dạng của Arduino
      processLine("Khoang cach: " + simulatedDistance.toFixed(1) + " cm | Trang thai mua: " +
                  (simulatedIsRaining ? "Co mua" : "Khong mua"));

      // Thỉnh thoảng gửi dữ liệu GPS mới (20% chance)
      if (Math.random() < 0.2) {
        const updatedGpsData = "Toa do:\nLat: " + simulatedLat.toFixed(6) +
                              "\nLng: " + simulatedLng.toFixed(6) +
                              "\nAlt: 100.0m\nSpeed: 0.0km/h\nSat: 8";
        processLine("Cap nhat GPS:");
        processLine(updatedGpsData);
        processLine("-------------------");
      }

      // Send the simulated data directly
      onDataReceived({
        distance: simulatedDistance,
        isRaining: simulatedIsRaining ? 0 : 1, // 0 = có mưa (true), 1 = không mưa (false)
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

  // Only render client-side content after hydration is complete
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {isHydrated && isSerialSupported === false && (
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

      {/* Only render interactive elements after hydration */}
      {isHydrated ? (
        <>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              onClick={isConnected ? disconnectFromDevice : connectToDevice}
              disabled={isConnecting || isSerialSupported === null}
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
        </>
      ) : (
        // Placeholder during server-side rendering to avoid hydration mismatch
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            disabled={true}
            variant="default"
            size="lg"
            className="w-full sm:w-auto py-6 text-base transition-all duration-300 shadow-md"
          >
            <Usb className="mr-2 h-5 w-5" />
            Kết nối thiết bị
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-sm"
            >
              <span className="flex items-center">
                <WifiOff className="mr-1.5 h-3.5 w-3.5" />
                Chưa kết nối
              </span>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
