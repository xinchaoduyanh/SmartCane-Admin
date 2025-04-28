"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  AlertCircle,
  MapPin,
  Send,
  Smartphone,
  Wifi,
  Zap,
  Settings,
  Save,
  Ruler,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DeviceConnection } from "@/components/device-connection";
import { PhoneNumberList } from "@/components/phone-number-list";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/hero-section";
import { StatusCard } from "@/components/status-card";
import { DistanceChart } from "@/components/distance-chart";

export default function Home() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Cứu tôi với tôi đang ở {GPS}"
  );
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isRaining, setIsRaining] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceConnection, setDeviceConnection] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [forceRealMode, setForceRealMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentLocation) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [currentLocation]);

  // Handle successful connection
  const handleConnected = (connection: any) => {
    setIsConnected(true);
    setDeviceConnection(connection);

    // Đọc cấu hình từ thiết bị
    connection
      .readConfiguration()
      .then(() => {
        toast({
          title: "Kết nối thành công",
          description: "Đã kết nối với thiết bị gậy thông minh",
        });
      })
      .catch((error: any) => {
        console.error("Lỗi khi đọc cấu hình:", error);
        toast({
          title: "Lỗi đọc cấu hình",
          description: "Không thể đọc cấu hình từ thiết bị",
          variant: "destructive",
        });
      });
  };

  // Handle disconnection
  const handleDisconnected = () => {
    setIsConnected(false);
    setDeviceConnection(null);
    setIsConfigLoaded(false);

    toast({
      title: "Đã ngắt kết nối",
      description: "Thiết bị đã ngắt kết nối",
      variant: "destructive",
    });
  };

  // Handle data received from device
  const handleDataReceived = (data: any) => {
    console.log("Data received from device:", data);
    if (data.distance) {
      setDistance(data.distance);
    }
    if (data.isRaining !== undefined) {
      setIsRaining(data.isRaining === 0);
    }
    if (data.gps && data.gps.lat && data.gps.lng) {
      setCurrentLocation(data.gps);
    }
  };

  // Handle configuration received from device
  const handleConfigReceived = (config: any) => {
    if (config.message) {
      setMessageTemplate(config.message);
    }

    if (config.phones) {
      setPhoneNumbers(config.phones.filter((phone: string) => phone));
    }

    setIsConfigLoaded(true);

    toast({
      title: "Đã tải cấu hình",
      description: "Cấu hình đã được tải từ thiết bị",
    });
  };

  // Save configuration to device
  const saveConfiguration = async () => {
    if (!deviceConnection) return;

    setIsSaving(true);

    try {
      // Cập nhật tin nhắn
      await deviceConnection.updateMessageTemplate(messageTemplate);

      // Xóa tất cả số điện thoại cũ
      await deviceConnection.clearPhoneNumbers();

      // Thêm từng số điện thoại mới
      for (const phone of phoneNumbers) {
        await deviceConnection.addPhoneNumber(phone);
      }

      toast({
        title: "Đã lưu cấu hình",
        description: "Cấu hình đã được lưu vào thiết bị",
      });
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
      toast({
        title: "Lỗi lưu cấu hình",
        description: "Không thể lưu cấu hình vào thiết bị",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate message with GPS coordinates
  const generateMessage = () => {
    if (!currentLocation) return messageTemplate;

    const googleMapsLink = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
    return messageTemplate.replace("{GPS}", googleMapsLink);
  };

  // Add a warning message for preview environments
  useEffect(() => {
    const isPreviewMode =
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("netlify.app");

    if (isPreviewMode) {
      toast({
        title: "Chế độ xem trước",
        description:
          "Ứng dụng đang chạy ở chế độ xem trước. Kết nối thiết bị sẽ được mô phỏng.",
        duration: 6000,
      });
    }
  }, [toast]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <HeroSection />

      <div className="container mx-auto px-4 py-8 pb-20">
        <Tabs defaultValue="connect" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="connect" className="text-base py-3">
              <Wifi className="mr-2 h-4 w-4" />
              Kết Nối & Trạng Thái
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-base py-3">
              <Settings className="mr-2 h-4 w-4" />
              Cài Đặt Thiết Bị
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2" />
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-purple-500" />
                    Kết Nối Thiết Bị
                  </CardTitle>
                  <CardDescription>
                    Kết nối với gậy thông minh qua cổng Serial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DeviceConnection
                    onConnected={handleConnected}
                    onDisconnected={handleDisconnected}
                    onDataReceived={handleDataReceived}
                    onConfigReceived={handleConfigReceived}
                  />

                  {isConnected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium flex items-center">
                          <div
                            className={`mr-2 h-3 w-3 rounded-full ${
                              isConnected
                                ? "bg-green-500 animate-pulse"
                                : "bg-red-500"
                            }`}
                          ></div>
                          Trạng Thái Thiết Bị
                        </h3>
                        <Badge
                          variant={isConnected ? "success" : "destructive"}
                          className="px-3 py-1"
                        >
                          {isConnected ? "Đang hoạt động" : "Ngắt kết nối"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                          animate={{
                            scale:
                              distance !== null && distance < 50
                                ? [1, 1.03, 1]
                                : 1,
                            transition: {
                              repeat:
                                distance !== null && distance < 50
                                  ? Number.POSITIVE_INFINITY
                                  : 0,
                              duration: 1,
                            },
                          }}
                        >
                          <StatusCard
                            title="Khoảng Cách"
                            value={
                              distance !== null
                                ? `${distance} cm`
                                : "Đang đọc..."
                            }
                            icon="distance"
                            color={
                              distance !== null && distance < 50
                                ? "red"
                                : "blue"
                            }
                            description={
                              distance !== null && distance < 50
                                ? "Cảnh báo: Có vật cản phía trước!"
                                : "Đường đi thông thoáng"
                            }
                            alert={distance !== null && distance < 50}
                          />
                        </motion.div>

                        <motion.div
                          animate={{
                            scale: isRaining ? [1, 1.03, 1] : 1,
                            transition: {
                              repeat: isRaining ? Number.POSITIVE_INFINITY : 0,
                              duration: 1,
                            },
                          }}
                        >
                          <StatusCard
                            title="Thời Tiết"
                            value={isRaining ? "Có Mưa" : "Không Mưa"}
                            icon={isRaining ? "rain" : "sun"}
                            color={isRaining ? "red" : "green"}
                            description={
                              isRaining
                                ? "Cảnh báo: Trời đang mưa!"
                                : "Thời tiết tốt"
                            }
                            alert={isRaining}
                          />
                        </motion.div>
                      </div>

                      {(isRaining || (distance !== null && distance < 50)) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertTitle className="text-red-700 dark:text-red-300">
                              Cảnh báo!
                            </AlertTitle>
                            <AlertDescription className="text-red-600 dark:text-red-400">
                              {distance !== null && distance < 50 && isRaining
                                ? "Phát hiện vật cản phía trước và trời đang mưa. Hãy cẩn thận!"
                                : distance !== null && distance < 50
                                ? "Phát hiện vật cản phía trước. Khoảng cách: " +
                                  distance +
                                  " cm"
                                : "Trời đang mưa. Hãy cẩn thận!"}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6"
                      >
                        <Card className="border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-1" />
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Ruler className="mr-2 h-5 w-5 text-blue-500" />
                              Biểu Đồ Khoảng Cách Thời Gian Thực
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <DistanceChart distance={distance} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {currentLocation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Card className="border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-1" />
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center">
                                <MapPin className="mr-2 h-5 w-5 text-emerald-500" />
                                Vị Trí GPS
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center mb-3">
                                <div className="flex-1">
                                  <div className="text-xl font-semibold tracking-tight">
                                    {currentLocation.lat.toFixed(6)},{" "}
                                    {currentLocation.lng.toFixed(6)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Vị trí được cập nhật lần cuối:{" "}
                                    {lastUpdate ? lastUpdate : ""}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-4"
                                  asChild
                                >
                                  <a
                                    href={`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center"
                                  >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Xem trên bản đồ
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                        <AlertCircle className="h-4 w-4 text-purple-500" />
                        <AlertTitle className="text-purple-700 dark:text-purple-300">
                          Trạng thái kết nối
                        </AlertTitle>
                        <AlertDescription className="text-purple-600 dark:text-purple-400">
                          Thiết bị đang được kết nối. Dữ liệu sẽ được cập nhật
                          tự động.
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-2" />
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center">
                      <Settings className="mr-2 h-5 w-5 text-pink-500" />
                      Cài Đặt Thiết Bị
                    </CardTitle>
                    <CardDescription>
                      Thiết lập mẫu tin nhắn và danh sách số điện thoại nhận tin
                      nhắn
                    </CardDescription>
                  </div>

                  <Button
                    onClick={saveConfiguration}
                    disabled={!isConnected || !isConfigLoaded || isSaving}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    {isSaving ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu cấu hình
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-medium mb-4 flex items-center">
                      <Send className="mr-2 h-5 w-5 text-pink-500" />
                      Mẫu Tin Nhắn
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sử dụng{" "}
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                        {"{GPS}"}
                      </span>{" "}
                      để chèn vị trí GPS vào tin nhắn
                    </p>
                    <Textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Nhập mẫu tin nhắn..."
                      className="min-h-[100px] text-base"
                      disabled={!isConnected || !isConfigLoaded}
                    />

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Xem trước tin nhắn:
                      </h4>
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                        {generateMessage()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-medium mb-4 flex items-center">
                      <Smartphone className="mr-2 h-5 w-5 text-pink-500" />
                      Danh Sách Số Điện Thoại
                    </h3>
                    <PhoneNumberList
                      phoneNumbers={phoneNumbers}
                      setPhoneNumbers={setPhoneNumbers}
                      disabled={!isConnected || !isConfigLoaded}
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  <div className="w-full flex flex-col md:flex-row gap-4">
                    <Alert className="flex-1 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertTitle className="text-amber-700 dark:text-amber-300">
                        Lưu ý quan trọng
                      </AlertTitle>
                      <AlertDescription className="text-amber-600 dark:text-amber-400">
                        Sau khi lưu cấu hình, bạn có thể ngắt kết nối thiết bị
                        và sử dụng độc lập. Thiết bị sẽ lưu các cài đặt này.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={saveConfiguration}
                      disabled={!isConnected || !isConfigLoaded || isSaving}
                      className="md:w-48 py-6 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Lưu cấu hình
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </main>
  );
}
