// =====================================================================
// FIREBASE CONFIG — แก้ไขค่าด้านล่างนี้ด้วยค่าจากโปรเจกต์ Firebase ของคุณเอง
// วิธีหาค่า: Firebase Console > ⚙️ Project settings > General
//            > Your apps > SDK setup and configuration > Config
// ดูขั้นตอนแบบละเอียดใน README.md หัวข้อ "ตั้งค่า Firebase"
// =====================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// เริ่มต้น Firebase (ป้องกันการ init ซ้ำถ้าถูกโหลดมากกว่าหนึ่งครั้ง)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// อ้างอิง Realtime Database ที่หน้าอื่น ๆ จะเรียกใช้ผ่านตัวแปร global นี้
const db = firebase.database();

// รหัสผ่านสำหรับเข้าหน้า Admin (แก้ไขได้ตามต้องการ)
const ADMIN_PIN = "1234";
