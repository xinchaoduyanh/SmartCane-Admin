#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <EEPROM.h>

// ================== Khai báo chân ==================
const int trigPin = A1;    
const int echoPin = A0;    
const int rainSensorPin = A4; 
const int buzzerPin = 5;   
const int buttonPin = 6;   

const int GPS_RX = 10;     
const int GPS_TX = 11;     
const int SIM_RX = 3;      
const int SIM_TX = 2;      

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
char message[160]; 

// ================== EEPROM ==================
void savePhoneNumbersToEEPROM() {
  int addr = 0;
  EEPROM.write(addr++, phoneNumberCount);
  for (int i = 0; i < phoneNumberCount; i++) {
    for (int j = 0; j < PHONE_NUMBER_LENGTH; j++) {
      EEPROM.write(addr++, phoneNumbers[i][j]);
    }
  }
}

void loadPhoneNumbersFromEEPROM() {
  int addr = 0;
  phoneNumberCount = EEPROM.read(addr++);
  if (phoneNumberCount > MAX_PHONE_NUMBERS) phoneNumberCount = 0;
  for (int i = 0; i < phoneNumberCount; i++) {
    for (int j = 0; j < PHONE_NUMBER_LENGTH; j++) {
      phoneNumbers[i][j] = EEPROM.read(addr++);
    }
  }
}

// ================== Setup ==================
void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);
  simSerial.begin(9600);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(rainSensorPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);

  digitalWrite(buzzerPin, LOW);

  simSerial.println("AT");
  delay(1000);
  simSerial.println("AT+CMGF=1"); 
  delay(1000);
  simSerial.println("AT+CSCS=\"GSM\"");
  delay(1000);
  Serial.println("Module SIM sẵn sàng.");

  loadPhoneNumbersFromEEPROM();

  Serial.println("Khoi dong hoan tat!");
}

// ================== Loop ==================
void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  long duration = measureUltrasonic(trigPin, echoPin);
  float distance = duration * 0.034 / 2;

  int isRaining = digitalRead(rainSensorPin);

  // TẠM DỪNG IN KHOẢNG CÁCH VÀ MƯA
  // Serial.print("Khoang cach: ");
  // Serial.print(distance);
  // Serial.println(" cm");

  // if (isRaining == 0) {
  //   Serial.println(">> Co mua!");
  // } else {
  //   Serial.println(">> Khong mua.");
  // }

  // In trạng thái nút nhấn
  if (digitalRead(buttonPin) == LOW) {
    Serial.println("Trang thai nut: DUOC BAM");
  } else {
    Serial.println("Trang thai nut: KHONG BAM");
  }

  // In toạ độ GPS
  if (gps.location.isValid()) {
    Serial.print("Toa do GPS: ");
    Serial.print("Lat: ");
    Serial.print(gps.location.lat(), 6);
    Serial.print(", Lng: ");
    Serial.println(gps.location.lng(), 6);
  } else {
    Serial.println("Dang tim toa do GPS...");
  }

  // Nhận lệnh từ Serial (Thêm/Xóa/Sửa số điện thoại hoặc tin nhắn)
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.startsWith("ADD")) {
      String phone = command.substring(4);
      addPhoneNumber(phone.c_str());
    } else if (command.startsWith("DELETE")) {
      int index = command.substring(7).toInt();
      deletePhoneNumber(index - 1);
    } else if (command.startsWith("UPDATE_MSG")) {
      String newMessage = command.substring(11);
      updateSOSMessage(newMessage.c_str());
    } else if (command == "DISPLAY") {
      displayPhoneNumbers();
    } else {
      Serial.println("Lenh khong hop le! Vui long thu lai.");
    }
  }

  handleBuzzer(isRaining, distance);
  handleButton();

  Serial.println("----------------------------");
  delay(200);
}

// ================== Gửi tin nhắn ==================
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
  simSerial.print(message);
  simSerial.write(26); 
  delay(5000);
  Serial.print("Tin nhan da duoc gui toi: ");
  Serial.println(phoneNumber);
}

// ================== Quản lý số điện thoại ==================
void addPhoneNumber(const char* phoneNumber) {
  if (phoneNumberCount < MAX_PHONE_NUMBERS) {
    strncpy(phoneNumbers[phoneNumberCount++], phoneNumber, PHONE_NUMBER_LENGTH);
    savePhoneNumbersToEEPROM();
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
    savePhoneNumbersToEEPROM();
    Serial.println("Xoa so dien thoai thanh cong!");
  } else {
    Serial.println("Chi so khong hop le!");
  }
}

void updateSOSMessage(const char* newMessage) {
  strncpy(sosMsg, newMessage, sizeof(sosMsg));
  Serial.println("Cap nhat tin nhan SOS thanh cong!");
}

void displayPhoneNumbers() {
  Serial.println("Danh sach so dien thoai:");
  for (int i = 0; i < phoneNumberCount; i++) {
    Serial.print(i + 1);
    Serial.print(". ");
    Serial.println(phoneNumbers[i]);
  }
}

// ================== Siêu âm ==================
long measureUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  return pulseIn(echoPin, HIGH);
}

// ================== Xử lý nút nhấn ==================
void handleButton() {
  if (digitalRead(buttonPin) == LOW) {
    delay(50);
    if (digitalRead(buttonPin) == LOW) {
      Serial.println("NUT DUOC BAM, DOC VI TRI GPS...");

      char finalMessage[200];
      strcpy(finalMessage, sosMsg);

      if (strstr(sosMsg, "{GPS}") != nullptr) {
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

// ================== Còi cảnh báo ==================
void handleBuzzer(int isRaining, float distance) {
  if (isRaining == 0) {
    digitalWrite(buzzerPin, HIGH);
    delay(100);
    digitalWrite(buzzerPin, LOW);
    delay(100);
  } else if (distance > 10 && distance < 50) {
    digitalWrite(buzzerPin, HIGH);
  } else {
    digitalWrite(buzzerPin, LOW);
  }
}

// ================== Thay thế {GPS} ==================
void replacePlaceholder(char* finalMessage, const char* placeholder, const char* replacement) {
  char* pos = strstr(finalMessage, placeholder);
  if (pos != nullptr) {
    size_t len = strlen(replacement);
    memcpy(pos, replacement, len);
  }
}
