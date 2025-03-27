const firebaseConfig = {
   apiKey: "",
   authDomain: "",
   projectId: "",
   storageBucket: "",
   messagingSenderId: "",
   appId: "",
   measurementId: ""
 };

firebase.initializeApp(firebaseConfig);
const database = firebase.database()
const ledRef = database.ref("device/led");
