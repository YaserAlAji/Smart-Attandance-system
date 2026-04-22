# Smart Attendance System Using IoT

A fully software-based simulation of a real-time RFID attendance system.
Designed as a university IoT course project — no hardware required.

---

## Project Idea

Traditional manual attendance methods in classrooms are slow, error-prone,
and do not provide real-time data to teachers. This project simulates an
IoT-based attendance system where students scan RFID cards at a classroom
reader. Attendance is automatically recorded, stored, and visualized —
all in real time.

Because this is a simulation, each part of the real hardware is replaced
by a software equivalent:

```
Real IoT System                   This Simulation
───────────────────────────────────────────────────
Student RFID Card           →     Keyboard input (typing student ID)
RFID-RC522 Reader           →     Python input() function
NodeMCU / ESP32 / ESP8266   →     Python script logic
Wi-Fi / MQTT Protocol       →     Simulated animation in terminal
Cloud Database              →     attendance_records.csv
Teacher Dashboard           →     Terminal table + PNG charts
```

---

## Block Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  RFID Card  │────▶│  RFID Reader │────▶│ NodeMCU / ESP32  │
│  (Student)  │     │  (RC522)     │     │ (Edge Processing) │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                  │
                                               Wi-Fi
                                                  │
                                         ┌────────▼─────────┐
                                         │   MQTT Broker    │
                                         │ (HiveMQ/Mosquitto)│
                                         └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │  Cloud Backend   │
                                         │ (Python / Flask) │
                                         └────────┬─────────┘
                                                  │
                          ┌───────────────────────┼────────────────────┐
                          │                       │                    │
                 ┌────────▼────────┐   ┌──────────▼────────┐   ┌──────▼──────┐
                 │    Database     │   │  Teacher Dashboard │   │ Notifications│
                 │  (CSV / MySQL)  │   │  (Charts / Table)  │   │ (Email/SMS) │
                 └─────────────────┘   └────────────────────┘   └─────────────┘
```

---

## How It Works

1. The program starts and shows a menu with 5 options.
2. The teacher selects **Scan RFID Card** and students enter their IDs.
3. Each valid scan is timestamped, recorded, and confirmed with an animation
   that simulates Wi-Fi and cloud upload.
4. Scanning the same ID twice is blocked (duplicate protection).
5. When scanning is complete, the teacher selects **Show Attendance Table**.
6. Students who did not scan are automatically marked **Absent**.
7. Charts and a CSV report can be generated at any time.

---

## Project Files

| File                       | Purpose                                    |
|----------------------------|--------------------------------------------|
| `main.py`                  | Main application — run this file           |
| `generate_samples.py`      | One-time helper to generate sample outputs |
| `attendance_records.csv`   | Exported attendance data (cloud record)    |
| `attendance_summary.png`   | Bar chart: Present vs Absent totals        |
| `student_attendance.png`   | Bar chart: per-student attendance status   |

---

## How to Run

### Step 1 — Install the only required library

```bash
pip install matplotlib
```

### Step 2 — Run the program

```bash
python main.py
```

### Step 3 — Use the menu

```
[1]  Scan RFID Card          ← type a student ID (e.g. 1001)
[2]  Show Attendance Table   ← view the full table
[3]  Generate Attendance Charts  ← saves PNG charts
[4]  Save Attendance to CSV  ← saves attendance_records.csv
[5]  Exit System
```

### Sample student IDs to scan

| ID   | Name   |
|------|--------|
| 1001 | Ahmed  |
| 1002 | Sara   |
| 1003 | Omar   |
| 1004 | Lina   |
| 1005 | Mariam |
| 1006 | Khalid |
| 1007 | Noor   |
| 1008 | Yasir  |

---

## Terminal Output Example

```
======================================================
         SMART ATTENDANCE SYSTEM USING IoT
       Simulated RFID  |  Wi-Fi  |  Cloud Storage
======================================================

  Session Date : Monday, 21 April 2026
  Session Time : 08:00 AM
  Students Reg : 8

------------------------------------------------------
  MAIN MENU
------------------------------------------------------
  [1]  Scan RFID Card
  [2]  Show Attendance Table
  [3]  Generate Attendance Charts
  [4]  Save Attendance to CSV
  [5]  Exit System
------------------------------------------------------
  Select an option [1-5]: 1

======================================================
  [ RFID SCANNER — CLASSROOM READER ]
======================================================
  Press ENTER with no input to return to menu.

  Scan RFID Card (Enter Student ID): 1001

  > RFID Card Detected...          ...
  > Connecting to Wi-Fi...         ...
  > Authenticating with server...  ...
  > Sending attendance data to cloud...

  ────────────────────────────────────────
    ✓  Attendance Recorded Successfully
  ────────────────────────────────────────
    Student : Ahmed
    ID      : 1001
    Time    : 08:01 AM
    Status  : Present
```

---

## IoT Mapping Explained

| IoT Component        | Simulated By                          |
|----------------------|---------------------------------------|
| RFID Card            | Student ID typed on keyboard          |
| RFID Reader (RC522)  | `input()` function in Python          |
| NodeMCU / ESP32      | Python script processing logic        |
| Wi-Fi / MQTT         | Terminal animation (simulated delay)  |
| Cloud Database       | `attendance_records.csv` file         |
| Teacher Dashboard    | Terminal table + matplotlib PNG charts|
| Notifications        | Terminal confirmation messages        |

---

## Future Improvements

- Replace keyboard input with a real RFID reader connected via USB serial port
- Publish attendance data to an MQTT broker (e.g., HiveMQ) using `paho-mqtt`
- Store records in Firebase or MySQL instead of a local CSV file
- Build a web dashboard using Flask or Streamlit for remote teacher access
- Add face recognition as a second factor to prevent proxy attendance
- Send email/SMS alerts for absent students using SendGrid or Twilio

---

## Requirements

- Python 3.8 or higher
- matplotlib (`pip install matplotlib`)
- No other external libraries needed
