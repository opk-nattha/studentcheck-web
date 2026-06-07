# Student Check 🎓

ระบบเช็คชื่อนักเรียนแบบ PWA (Progressive Web App) สำหรับห้องเรียน

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ผ่าน web server (ต้องใช้ HTTPS หรือ localhost เพื่อให้ Service Worker ทำงาน)
2. แก้ไขชื่อนักเรียนได้ที่ `src/config.js` → ช่อง `realName`
3. กดปุ่ม **มา / ลา / ขาด** เพื่อเช็คชื่อแต่ละคน
4. กดปุ่ม **บันทึก PNG** เพื่อดาวน์โหลดสรุปการเช็คชื่อ

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/config.js` | ตั้งค่าชื่อห้อง ชื่อนักเรียน สีสถานะ |
| `src/attendance.js` | จัดการสถานะการเช็คชื่อ |
| `src/ui.js` | สร้างและอัปเดต DOM |
| `src/screenshot.js` | ส่งออกรูป PNG ด้วย Canvas API |
| `sw.js` | Service Worker สำหรับ offline |
