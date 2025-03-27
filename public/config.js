const firebaseConfig = {
   apiKey: "AIzaSyBv_GMIALQf_uR_wgdiaotbR5C9lEA18LA",
   authDomain: "mini-iot-2.firebaseapp.com",
   projectId: "mini-iot-2",
   storageBucket: "mini-iot-2.firebasestorage.app",
   messagingSenderId: "445226609907",
   appId: "1:445226609907:web:9488f1cd02346ffc88db86",
   measurementId: "G-KVTV6ZXR43"
 };

firebase.initializeApp(firebaseConfig);
const database = firebase.database()
const ledRef = database.ref("device/led");
