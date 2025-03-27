#define APPLIANCE_ONE 22
#define APPLIANCE_TWO 23

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#define WIFI_SSID "wifi"
#define WIFI_PASSWORD "12345678"
#define API_KEY "AIzaSyBv_GMIALQf_uR_wgdiaotbR5C9lEA18LA"
#define SECRET "nxiAuvIkmf4jiUKt9zQqv1CHJJeG11gTkNCNbN1s"
#define DATABASE_URL "mini-iot-2-default-rtdb.firebaseio.com/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 1000; // 1 second
bool firebaseConnected = false;

void setup() {
  pinMode(APPLIANCE_ONE, OUTPUT);
  pinMode(APPLIANCE_TWO, OUTPUT);
  digitalWrite(APPLIANCE_ONE, LOW);
  digitalWrite(APPLIANCE_TWO, LOW);
  
  Serial.begin(115200);
  
  connectToWiFi();
  setupFirebase();
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
    Serial.print(".");
    delay(300);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nConnected with IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed");
  }
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = SECRET;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);
}

void loop() {
  if (millis() - lastUpdateTime >= UPDATE_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      updateAppliances();
      reportStatus();
    } else {
      Serial.println("WiFi disconnected, attempting to reconnect...");
      connectToWiFi();
    }
    lastUpdateTime = millis();
  }
}

void updateAppliances() {
  if (Firebase.ready() && Firebase.RTDB.getInt(&fbdo, "device/led")) {
    int controlState = fbdo.intData();
    
    if (controlState == 1) {
      digitalWrite(APPLIANCE_ONE, HIGH);
      digitalWrite(APPLIANCE_TWO, HIGH);
      Serial.println("Appliances ON");
    } else if (controlState == 0) {
      digitalWrite(APPLIANCE_ONE, LOW);
      digitalWrite(APPLIANCE_TWO, LOW);
      Serial.println("Appliances OFF");
    }
  } else {
    Serial.println("Failed to get control state: " + fbdo.errorReason());
  }
}

void reportStatus() {
  int state1 = digitalRead(APPLIANCE_ONE);
  int state2 = digitalRead(APPLIANCE_TWO);
  
  if (Firebase.ready()) {
    if (Firebase.RTDB.setInt(&fbdo, "device/state1", state1)) {
      Serial.println("State1 updated: " + String(state1));
    } else {
      Serial.println("Failed to update state1: " + fbdo.errorReason());
    }
    
    if (Firebase.RTDB.setInt(&fbdo, "device/state2", state2)) {
      Serial.println("State2 updated: " + String(state2));
    } else {
      Serial.println("Failed to update state2: " + fbdo.errorReason());
    }
  }
}