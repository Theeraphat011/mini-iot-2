const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.addEventListener("DOMContentLoaded", () => {
   const statusElement = document.getElementById("status");
   const distanceElement = document.getElementById("distance");
   const handActionElement = document.getElementById("hand-action");
   const state1Element = document.getElementById("state1-status");
   const state2Element = document.getElementById("state2-status");

   if (!statusElement || !distanceElement || !handActionElement || !state1Element || !state2Element) {
      console.error("Required DOM elements are missing. Please check your HTML.");
      return;
   }

   // เปิดกล้องและกลับด้านวิดีโอ
   navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
         video.srcObject = stream;
         video.style.transform = "scaleX(-1)"; // Mirror วิดีโอ
      })
      .catch((err) => {
         alert("Cannot access webcam: " + err.message);
      });

   // ตั้งค่า MediaPipe Hands
   const hands = new Hands({
      locateFile: (file) =>
         `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
   });
   hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
   });

   // กำหนดโครงมือ
   const HAND_CONNECTIONS = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4], // Thumb
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8], // Index finger
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12], // Middle finger
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16], // Ring finger
      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20], // Pinky finger
      [0, 17], // Palm base
   ];

   let lastHandStatus = null; // Store the last detected hand status

   hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1); // กลับด้าน canvas
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
         const landmarks = results.multiHandLandmarks[0];

         // วาดเส้นโครงมือ
         HAND_CONNECTIONS.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 2;
            ctx.stroke();
         });

         // วาดจุด landmarks
         landmarks.forEach((point) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
         });

         // คำนวณระยะห่าง
         const thumb = landmarks[4];
         const index = landmarks[8];
         const distance = Math.sqrt(
            Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
         );
         const isClosed = distance < 0.1 ? "Closed" : "Open";

         statusElement.innerText = isClosed;
         distanceElement.innerText = distance.toFixed(2);

         // ส่งสถานะมือไปยัง Firebase
         const newHandStatus = isClosed === "Closed" ? 0 : 1;
         if (newHandStatus !== lastHandStatus) {
            database.ref("device/led").set(newHandStatus);
            lastHandStatus = newHandStatus; // Update the last hand status
         }
      } else {
         statusElement.innerText = "No Hand";
         distanceElement.innerText = "0";

         // ไม่อัปเดต Firebase หากไม่มีมือ
         console.log("No hand detected. Retaining last status:", lastHandStatus);
      }
   });

   // Manual LED control via buttons
   document.getElementById("manual-led-on").addEventListener("click", () => {
      database.ref("device/led").set(1); // Turn LED ON
      statusElement.textContent = "LED ON (Manual)";
      handActionElement.textContent = "Manual Control: LED ON";
   });

   document.getElementById("manual-led-off").addEventListener("click", () => {
      database.ref("device/led").set(0); // Turn LED OFF
      statusElement.textContent = "LED OFF (Manual)";
      handActionElement.textContent = "Manual Control: LED OFF";
   });

   // Listen for changes in state1
   database.ref("device/state1").on("value", (snapshot) => {
      const state1 = snapshot.val();
      state1Element.textContent = state1 === 1 ? "Active" : "Inactive";
      state1Element.style.color = state1 === 1 ? "green" : "gray";
   });

   // Listen for changes in state2
   database.ref("device/state2").on("value", (snapshot) => {
      const state2 = snapshot.val();
      state2Element.textContent = state2 === 1 ? "Active" : "Inactive";
      state2Element.style.color = state2 === 1 ? "green" : "gray";
   });

   // รัน MediaPipe เมื่อวิดีโอพร้อม
   async function run() {
      try {
         await hands.initialize();
         // รอจนกว่าวิดีโอจะโหลดข้อมูล
         video.addEventListener("loadeddata", () => {
            setInterval(() => {
               if (video.readyState >= 2) {
                  // ตรวจสอบว่าเฟรมพร้อม
                  hands.send({ image: video });
               }
            }, 100);
         });
      } catch (err) {
         alert("MediaPipe failed to load: " + err.message);
      }
   }
   run();
});
