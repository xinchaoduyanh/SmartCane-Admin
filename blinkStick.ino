#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// ================== Khai báo chân ==================
const int trigPin = A1;    // SRF05 TRIG
const int echoPin = A0;    // SRF05 ECHO
const int rainSensorPin = A4; // MH-RD cảm biến mưa
const int buzzerPin = 4;   // Còi
const int buttonPin = 8;   // Nút nhấn

const int GPS_RX = 11;     // GPS TX -> Arduino RX
const int GPS_TX = 10;     // GPS RX -> Arduino TX
const int SIM_RX = 6;     // SIM TX -> Arduino RX
const int SIM_TX = 5;     // SIM RX -> Arduino TX

// ================== Khai báo đối tượng ==================
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);
SoftwareSerial simSerial(SIM_RX, SIM_TX);
TinyGPSPlus gps;

// ================== Danh sách số điện thoại ==================
#define MAX_PHONE_NUMBERS 5
#define PHONE_NUMBER_LENGTH 15
char phoneNumbers[MAX_PHONE_NUMBERS][PHONE_NUMBER_LENGTH];
int phoneNumberCount = 0;
char sosMsg[100];

void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(rainSensorPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP); // Nút kéo lên nội bộ

  digitalWrite(buzzerPin, LOW);

  simSerial.println("AT");
  delay(1000);
  simSerial.println("AT+CMGF=1"); // Chế độ nhắn tin văn bản
  delay(1000);
  simSerial.println("AT+CSCS=\"GSM\"");
  delay(1000);
  Serial.println("Module SIM sẵn sàng.");

  Serial.println("Khoi dong hoan tat!");
}

void loop() {
  // Cập nhật dữ liệu GPS
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // --- Đọc khoảng cách ---
  long duration = measureUltrasonic(trigPin, echoPin);
  float distance = duration * 0.034 / 2;

  // --- Đọc cảm biến mưa ---
  int isRaining = digitalRead(rainSensorPin); // 0 = có mưa

  // --- In thông tin ra Serial ---
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (isRaining == 0) {
    Serial.println(">> Co mua!");
  } else {
    Serial.println(">> Khong mua.");
  }
  // --- Tương tác với web ---
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n'); // Đọc lệnh kết thúc bằng newline
    command.trim(); // Loại bỏ khoảng trắng thừa

    if (command.startsWith("ADD")) {
      String phone = command.substring(4); // Lấy số điện thoại sau "ADD "
      addPhoneNumber(phone.c_str());
    } else if (command.startsWith("DELETE")) {
      int index = command.substring(7).toInt(); // Lấy chỉ số sau "DELETE "
      deletePhoneNumber(index - 1); // Chỉ số nhập vào bắt đầu từ 1
    } else if (command.startsWith("UPDATE_MSG")) {
      String newMessage = command.substring(11); // Lấy tin nhắn sau "UPDATE_MSG "
      updateSOSMessage(newMessage.c_str());
    } else if (command == "DISPLAY") {
      displayPhoneNumbers();
    } else {
      Serial.println("Lenh khong hop le! Vui long thu lai.");
    }
  }
  // --- Xử lý còi ---
  handleBuzzer(isRaining, distance);

  // --- Xử lý nút nhấn ---
  handleButton();
  
  Serial.println("----------------------------");
  delay(200);
}

 // ===== Hàm gửi tin nhắn =====
 void sendSMSToAll(const char* message) {
  for (int i = 0; i < phoneNumberCount; i++) {
    sendSMS(phoneNumbers[i], message);
  }
}
void sendSMS(const char* phoneNumber, const char* message) {
  simSerial.print("AT+CMGS=\"");
  simSerial.print(phoneNumber);
  simSerial.println("\"");
  delay(1000);
  simSerial.print(finalMessage);
  simSerial.write(26);
  delay(5000);
  Serial.print("Tin nhan da duoc gui toi: ");
  Serial.println(phoneNumber);
}
void addPhoneNumber(const char* phoneNumber) {
  if (phoneNumberCount < MAX_PHONE_NUMBERS) {
    strncpy(phoneNumbers[phoneNumberCount++], phoneNumber, PHONE_NUMBER_LENGTH);
    Serial.println("Them so dien thoai thanh cong!");
  } else {
    Serial.println("Danh sach so dien thoai da day!");
  }
}

void deletePhoneNumber(int index) {
  if (index >= 0 && index < phoneNumberCount) {
    for (int i = index; i < phoneNumberCount - 1; i++) {
      strncpy(phoneNumbers[i], phoneNumbers[i + 1], PHONE_NUMBER_LENGTH);
    }
    phoneNumberCount--;
    Serial.println("Xoa so dien thoai thanh cong!");
  } else {
    Serial.println("Chi so khong hop le!");
  }
}
// ===== Cập nhật tin nhắn SOS =====
void updateSOSMessage(const char* newMessage) {
  strncpy(sosMsg, newMessage, sizeof(sosMsg));
  Serial.println("Cap nhat tin nhan SOS thanh cong!");
}

// ===== Hiển thị danh sách số điện thoại =====
void displayPhoneNumbers() {
  Serial.println("Danh sach so dien thoai:");
  for (int i = 0; i < phoneNumberCount; i++) {
    Serial.print(i + 1);
    Serial.print(". ");
    Serial.println(phoneNumbers[i]);
  }
}


// ===== Hàm đo siêu âm =====
long measureUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  return pulseIn(echoPin, HIGH);
}

void handleButton(){
  if (digitalRead(buttonPin) == LOW) {
    delay(50); // Chống nhiễu
    if (digitalRead(buttonPin) == LOW) {
      Serial.println("NUT DUOC BAM, DOC VI TRI GPS...");

      char finalMessage[200];
      strcpy(finalMessage, sosMsg);

      if (strstr(message, "{GPS}") != nullptr) { // Kiểm tra nếu `{GPS}` tồn tại trong message
        if (gps.location.isValid()) {
          float latitude = gps.location.lat();
          float longitude = gps.location.lng();
          char gpsLink[100];
          snprintf(gpsLink, sizeof(gpsLink), "https://maps.google.com/?q=%.6f,%.6f", latitude, longitude);
          replacePlaceholder(finalMessage, "{GPS}", gpsLink);
        } else {
          replacePlaceholder(finalMessage, "{GPS}", "Toa do khong hop le");
        }
      }
      sendSMSToAll(finalMessage);
    }
  }
}

void handleBuzzer(int isRaining, float distance) {
  if (isRaining == 0) {
    // ===== Cảnh báo mưa: còi nháy nhanh =====
    digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  delay(100);
  } else if (distance > 0 && distance < 20) {
    // ===== Cảnh báo vật cản: còi kêu dài =====
    digitalWrite(buzzerPin, HIGH);
  } else {
    // ===== Không cảnh báo =====
    digitalWrite(buzzerPin, LOW);
  }
}
