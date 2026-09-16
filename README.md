# ระบบประเมินความพึงพอใจฐานกิจกรรม (Activity Station Satisfaction Rating & Leaderboard)

ระบบ Web Application สำหรับใช้เป็น Kiosk ประเมินความพึงพอใจฐานกิจกรรม พร้อมระบบ Admin Dashboard และหน้า **Leaderboard** รวมผลจากไฟล์ Excel/CSV หลายไฟล์

---

## 🌟 ฟีเจอร์หลัก (Key Features)
1. **หน้าโหวต Kiosk (index.html)**:
   - จัดเรียง 6 ฐานกิจกรรมตามลำดับตัวอักษรอย่างเคร่งครัด: **A, B, C, D, E, F**
   - รองรับ 4 ภาษา (ไทย, เมียนมา, กัมพูชา, ลาว)
   - **เอา Pop-up ดีเลย์ 3 วินาทีออกแล้ว**: เปลี่ยนเป็นการแจ้งเตือนแบบ Toast ทันที ผู้เข้าร่วมคนถัดไปสามารถกดไลค์โหวตต่อได้ต่อเนื่องโดยไม่ต้องรอ
   - ป้องกันด้วย PIN Code สำหรับเข้าหน้า Admin (ค่าเริ่มต้น: `1234`)
   - ระบบเก็บข้อมูล Real-time ในเบราว์เซอร์ (`LocalStorage`)
   - **รองรับการส่งออกข้อมูลเป็น Excel (.xlsx) และ CSV (UTF-8 BOM)** 

2. **หน้า Leaderboard รวมผลหลายไฟล์ (leaderboard.html)**:
   - รองรับการอัปโหลดหรือ Drag & Drop ไฟล์ `.xlsx`, `.xls` และ `.csv` หลายๆ ไฟล์พร้อมกัน
   - ระบบคำนวณและประมวลผลคะแนนสะสม (Grand Total) ทันที
   - แสดงโพเดียม 3 อันดับแรก (🥇 🥈 🥉) พร้อมตารางจัดอันดับแบบละเอียด
   - แสดงรายละเอียดคะแนนแยกตามแต่ละไฟล์ที่นำเข้า
   - ปุ่มส่งออกสรุปภาพรวมทั้งหมดออกเป็นไฟล์ Excel (`.xlsx`) ทันที

---

## 🚀 วิธีการติดตั้งและ Deploy บน GitHub Pages (ฟรี 100%)

### วิธีที่ 1: อัปโหลดผ่าน GitHub Web Interface
1. สร้าง Repository ใหม่บน GitHub เช่น ชื่อ `activity-satisfaction`
2. เลือกเป็น **Public**
3. คลิกปุ่ม **Add file** -> **Upload files**
4. ลากไฟล์ทั้งหมดในโฟลเดอร์นี้ (`index.html`, `leaderboard.html`, `README.md`, ตัวอย่างไฟล์ `.csv`) ไปวางแล้วกด **Commit changes**
5. ไปที่แท็บ **Settings** ของ Repository -> เมนูทางซ้ายเลือก **Pages**
6. ใต้หัวข้อ **Build and deployment**:
   - Source: เลือก **Deploy from a branch**
   - Branch: เลือก `main` หรือ `master` และโฟลเดอร์ `/ (root)`
   - กด **Save**
7. รอประมาณ 1-2 นาที คุณจะได้ URL เว็บไซต์ เช่น:
   - หน้าหลัก (Kiosk โหวต): `https://<username>.github.io/<repo-name>/`
   - หน้า Leaderboard รวมไฟล์: `https://<username>.github.io/<repo-name>/leaderboard.html`

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
```
├── index.html                           # หน้าหลักโหวต Kiosk + Admin Dashboard
├── leaderboard.html                     # หน้า Leaderboard รวมคะแนนจากไฟล์ Excel/CSV หลายไฟล์
├── README.md                            # คู่มือการใช้งานและการติดตั้งบน GitHub
└── สรุปผลประเมินฐานกิจกรรม_2026-09-16.csv  # ไฟล์ตัวอย่างข้อมูลสำหรับทดสอบอัปโหลด
```
