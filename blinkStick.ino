#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <EEPROM.h>

// GPS
SoftwareSerial gpsSerial(11, 10); // GPS RX, TX
TinyGPSPlus gps;

// GSM
SoftwareSerial gsmSerial(2, 3);   // GSM RX, TX
String messageContent = "This is a test message with GPS data.";  // Nội dung tin nhắn

// Cảm biến siêu âm
#define TRIG_PIN1 A1
#define ECHO_PIN1 A0

// Cảm biến mưa (Analog)
#define RAIN_SENSOR_PIN A4

// Buzzer và nút nhấn
#define BUZZER_PIN 5
#define BUTTON_PIN 6

unsigned long lastRainBeep = 0;
bool gpsActive = true;
String latestGPS = "";

// Cấu hình lưu số điện thoại
#define MAX_PHONE_NUMBER_LENGTH 12
#define MAX_PHONE_LIST_SIZE 5

void setup() {
  Serial.begin(9600);

  pinMode(TRIG_PIN1, OUTPUT);
  pinMode(ECHO_PIN1, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);

  gpsSerial.begin(9600);
  Serial.println("Dang cho GPS fix...");

  readPhoneNumbersFromEEPROM();
}

void loop() {
  if (gpsActive) {
    updateGPS();
  }

  long distance = readUltrasonic(TRIG_PIN1, ECHO_PIN1);
  int rainValue = analogRead(RAIN_SENSOR_PIN);
  bool isRaining = rainValue < 400;

  // In trạng thái mưa và khoảng cách (chỉ in CO MUA / KHONG MUA)
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.print(" cm | Trang thai: ");
  Serial.println(isRaining ? "CO MUA" : "KHONG MUA");

  // Buzzer logic
  bool isDistanceDanger = (distance >= 10 && distance <= 40);
  if (isDistanceDanger) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (isRaining) {
    if (millis() - lastRainBeep >= 1000) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      lastRainBeep = millis();
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // Gửi tin nhắn khi nhấn nút
  if (digitalRead(BUTTON_PIN) == LOW && latestGPS != "") {
    delay(200);
    Serial.println("Nut duoc nhan → gui SMS cho tat ca so dien thoai...");

    gpsSerial.end();
    gpsActive = false;

    gsmSerial.begin(115200);
    delay(2000);
    checkSIM();
    delay(2000);
    sendSMSToAllNumbers();
    delay(1000);
    gsmSerial.end();

    gpsSerial.begin(9600);
    gpsActive = true;
    Serial.println("Bat lai GPS sau khi gui xong.");
  }

  // Nhập lệnh qua Serial: ADD / DELETE / LIST
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.startsWith("ADD")) {
      String phoneNumber = input.substring(4);
      addPhoneNumber(phoneNumber);
    } else if (input.startsWith("DELETE")) {
      String phoneNumber = input.substring(7);
      deletePhoneNumber(phoneNumber);
    } else if (input == "LIST") {
      listPhoneNumbers();
    }
  }

  delay(300);
}

// -------------------- GPS --------------------

void updateGPS() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isUpdated()) {
    latestGPS = "Toa do:\nLat: " + String(gps.location.lat(), 6)
              + "\nLng: " + String(gps.location.lng(), 6)
              + "\nAlt: " + String(gps.altitude.meters(), 1) + "m"
              + "\nSpeed: " + String(gps.speed.kmph(), 1) + "km/h"
              + "\nSat: " + String(gps.satellites.value());

    Serial.println("Cap nhat GPS:");
    Serial.println(latestGPS);
    Serial.println("-------------------");
  }
}

// -------------------- Cảm biến khoảng cách --------------------

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  return duration * 0.034 / 2;
}

// -------------------- Gửi tin nhắn --------------------

void sendSMS(String content, String phoneNumber) {
  Serial.print("Dang gui SMS toi: ");
  Serial.println(phoneNumber);

  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(phoneNumber);
  gsmSerial.println("\"");

  if (waitFor(">", 5000)) {
    gsmSerial.print(content);
    delay(500);
    gsmSerial.write(26);  // Ctrl+Z
    if (waitFor("+CMGS", 10000)) {
      Serial.println("SMS gui thanh cong.");
    } else {
      Serial.println("SMS gui that bai.");
    }
  } else {
    Serial.println("Khong nhan duoc ky tu >.");
  }
}

void sendSMSToAllNumbers() {
  for (int i = 0; i < MAX_PHONE_LIST_SIZE; i++) {
    String phoneNumber = "";
    for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
      char c = char(EEPROM.read(i * MAX_PHONE_NUMBER_LENGTH + j));
      if (c == '\0') break;
      phoneNumber += c;
    }
    if (phoneNumber.length() > 0) {
      sendSMS(latestGPS + "\n" + messageContent, phoneNumber);
    }
  }
}

void checkSIM() {
  sendCommand("AT", "OK", 2000);
  sendCommand("ATE0", "OK", 1000);
  sendCommand("AT+CMGF=1", "OK", 2000);
  sendCommand("AT+CSCS=\"GSM\"", "OK", 2000);
  sendCommand("AT+CSQ", "OK", 2000);
  sendCommand("AT+CPIN?", "READY", 2000);
}

void sendCommand(String cmd, String expected, unsigned long timeout) {
  while (gsmSerial.available()) gsmSerial.read();
  gsmSerial.println(cmd);
  waitFor(expected, timeout);
}

bool waitFor(String expected, unsigned long timeout) {
  unsigned long startTime = millis();
  String response = "";
  while (millis() - startTime < timeout) {
    while (gsmSerial.available()) {
      char c = gsmSerial.read();
      response += c;
      if (response.indexOf(expected) != -1) {
        return true;
      }
    }
  }
  return false;
}

// -------------------- EEPROM quản lý số điện thoại --------------------

void addPhoneNumber(String phoneNumber) {
  for (int i = 0; i < MAX_PHONE_LIST_SIZE; i++) {
    String existing = "";
    for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
      char c = char(EEPROM.read(i * MAX_PHONE_NUMBER_LENGTH + j));
      if (c == '\0') break;
      existing += c;
    }
    if (existing == phoneNumber) {
      Serial.println("So dien thoai da ton tai.");
      return;
    } else if (existing == "") {
      for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
        if (j < phoneNumber.length()) {
          EEPROM.write(i * MAX_PHONE_NUMBER_LENGTH + j, phoneNumber[j]);
        } else {
          EEPROM.write(i * MAX_PHONE_NUMBER_LENGTH + j, '\0');
        }
      }
      Serial.println("Da them so: " + phoneNumber);
      return;
    }
  }
  Serial.println("Danh sach da day.");
}

void deletePhoneNumber(String phoneNumber) {
  for (int i = 0; i < MAX_PHONE_LIST_SIZE; i++) {
    String existing = "";
    for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
      char c = char(EEPROM.read(i * MAX_PHONE_NUMBER_LENGTH + j));
      if (c == '\0') break;
      existing += c;
    }
    if (existing == phoneNumber) {
      for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
        EEPROM.write(i * MAX_PHONE_NUMBER_LENGTH + j, '\0');
      }
      Serial.println("Da xoa so: " + phoneNumber);
      return;
    }
  }
  Serial.println("Khong tim thay so.");
}

void listPhoneNumbers() {
  Serial.println("Danh sach so dien thoai:");
  for (int i = 0; i < MAX_PHONE_LIST_SIZE; i++) {
    String number = "";
    for (int j = 0; j < MAX_PHONE_NUMBER_LENGTH; j++) {
      char c = char(EEPROM.read(i * MAX_PHONE_NUMBER_LENGTH + j));
      if (c == '\0') break;
      number += c;
    }
    if (number.length() > 0) {
      Serial.println(number);
    }
  }
}

void readPhoneNumbersFromEEPROM() {
  Serial.println("Dang tai danh sach so dien thoai...");
  listPhoneNumbers();
}
