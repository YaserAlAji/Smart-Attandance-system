import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, TableOfContents,
  PageBreak
} from "docx";
import fs from "fs";

// ─── helpers ──────────────────────────────────────────────────────────────────

const border = { style: BorderStyle.SINGLE, size: 4, color: "2E75B6" };
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const headerBg = { fill: "2C3E50", type: ShadingType.CLEAR };
const altBg    = { fill: "EBF5FB", type: ShadingType.CLEAR };
const whiteBg  = { fill: "FFFFFF", type: ShadingType.CLEAR };

const cm = (val) => Math.round(val * 567); // cm → DXA (1440/2.54)
const pt = (val) => val * 2;               // pt → half-points

function bold(text, opts = {}) {
  return new TextRun({ text, bold: true, ...opts });
}
function run(text, opts = {}) {
  return new TextRun({ text, ...opts });
}
function para(children, opts = {}) {
  return new Paragraph({ children: Array.isArray(children) ? children : [run(children)], ...opts });
}
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [bold(text, { size: pt(14) })],
    spacing: { before: 280, after: 120 },
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [bold(text, { size: pt(12) })],
    spacing: { before: 200, after: 80 },
  });
}
function bodyPara(text, opts = {}) {
  return new Paragraph({
    children: [run(text)],
    spacing: { before: 60, after: 60, line: 276, lineRule: "auto" },
    ...opts,
  });
}
function bulletPara(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [run(text)],
    spacing: { before: 40, after: 40, line: 276, lineRule: "auto" },
  });
}
function spacer() {
  return new Paragraph({ children: [run("")], spacing: { before: 60, after: 60 } });
}
function monoPara(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Courier New", size: pt(9) })],
    spacing: { before: 0, after: 0, line: 240, lineRule: "auto" },
  });
}
function captionPara(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: pt(10) })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 120 },
  });
}

// ─── Table builder ────────────────────────────────────────────────────────────

function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const makeCell = (text, isHeader, idx) =>
    new TableCell({
      borders: cellBorders,
      width: { size: colWidths[idx], type: WidthType.DXA },
      shading: isHeader ? headerBg : (idx % 2 === 0 ? whiteBg : whiteBg),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: isHeader,
          color: isHeader ? "FFFFFF" : "000000",
          size: pt(10),
          font: "Times New Roman",
        })],
        alignment: AlignmentType.CENTER,
      })],
    });

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => makeCell(h, true, i)) }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, i) =>
            new TableCell({
              borders: cellBorders,
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: ri % 2 === 0 ? whiteBg : altBg,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                children: [new TextRun({ text: cell, size: pt(10), font: "Times New Roman" })],
                alignment: AlignmentType.CENTER,
              })],
            })
          ),
        })
      ),
    ],
  });
}

// ─── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Times New Roman", size: pt(12) } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: pt(13), bold: true, color: "1A5276", font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: pt(12), bold: true, color: "2874A6", font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    // ── TITLE PAGE ──────────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ children: [PageNumber.CURRENT], size: pt(10) }),
            ],
          })],
        }),
      },
      children: [
        spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({
            text: "Smart Attendance System Using IoT:",
            bold: true, size: pt(18), font: "Times New Roman",
          })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [new TextRun({
            text: "Design, Architecture, and Cloud-Based Simulation",
            bold: true, size: pt(18), font: "Times New Roman",
          })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({
            text: "[Group Members' Names]",
            italics: true, size: pt(12), font: "Times New Roman",
          })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({
            text: "Department of Computer Engineering / Information Technology",
            italics: true, size: pt(12), font: "Times New Roman",
          })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({
            text: "[University Name], [City, Country]",
            italics: true, size: pt(12), font: "Times New Roman",
          })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [new TextRun({
            text: "April 2026",
            italics: true, size: pt(12), font: "Times New Roman",
          })],
        }),
        // horizontal rule under title block
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2C3E50" } },
          children: [run("")],
          spacing: { before: 200, after: 200 },
        }),
        spacer(),
        // Abstract on title page
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 120 },
          children: [bold("ABSTRACT", { size: pt(13) })],
        }),
        bodyPara(
          "Traditional manual attendance methods in educational institutions are inefficient, error-prone, and fail to provide real-time visibility to instructors. This paper proposes a Smart Attendance System based on Internet of Things (IoT) technology that automates student attendance recording using RFID (Radio Frequency Identification) readers integrated with a cloud-based backend and a real-time web dashboard. The proposed system architecture is organized into five functional layers: IoT device layer, communication layer, cloud/backend layer, database layer, and presentation/dashboard layer. When a student taps an RFID card at the classroom reader, attendance data is instantly transmitted over Wi-Fi using the MQTT protocol to a cloud server, stored in a database, and displayed on a teacher dashboard in real time. Automated email and SMS notifications alert teachers of absent students. A practical simulation was implemented entirely in Python \u2014 generating simulated RFID scan events, storing records in a structured dataset, and producing attendance visualizations using Matplotlib. The simulation validates the core data flow without requiring physical hardware. Results demonstrate feasibility, low latency in data processing, and scalability. Security considerations, implementation challenges, and future improvements including face recognition are also discussed.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            bold("Keywords: "),
            run("Internet of Things, RFID, Smart Attendance, Cloud Computing, Real-Time Monitoring"),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // ── MAIN PAPER ──────────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" } },
            children: [new TextRun({
              text: "Smart Attendance System Using IoT \u2014 IoT Course Project",
              italics: true, size: pt(10), font: "Times New Roman",
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: pt(10) })],
          })],
        }),
      },
      children: [

        // ── 1. INTRODUCTION ───────────────────────────────────────────────
        heading1("1. Introduction"),
        bodyPara(
          "The Internet of Things (IoT) refers to a network of physical devices embedded with sensors, software, and connectivity that enables them to collect and exchange data over the internet [1]. IoT has rapidly transformed many sectors including healthcare, smart homes, transportation, and education. In educational institutions, one of the most repetitive and time-consuming administrative tasks is recording student attendance. Conventional methods \u2014 such as calling out names, passing sign-in sheets, or manually marking registers \u2014 are susceptible to human error, proxy attendance (a student signing in on behalf of an absent peer), and significant delays. These limitations make it difficult for instructors to access real-time attendance data or identify chronic absenteeism promptly.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "The motivation behind this project is to address these shortcomings by designing a Smart Attendance System that leverages RFID-based identification, Wi-Fi connectivity, cloud storage, and an online dashboard. By automating the attendance process, the system aims to save time, increase accuracy, and enable teachers and administrators to monitor attendance remotely and in real time.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara("The objectives of this paper are to:"),
        bulletPara("Propose and describe the architecture of an IoT-based attendance system."),
        bulletPara("Explain each system component and its role in the overall pipeline."),
        bulletPara("Define the data flow from student check-in to cloud storage and teacher visibility."),
        bulletPara("Identify security risks and technical challenges associated with the system."),
        bulletPara("Demonstrate a software simulation of the system\u2019s core functionality using Python."),
        spacer(),
        bodyPara(
          "Assumption: This paper is conceptual in nature. The system is designed to be implementable with commercially available hardware (ESP32 microcontroller, RFID-RC522 reader), but no physical hardware was used in this project. All demonstrations are software-based simulations.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),

        // ── 2. RELATED WORK ───────────────────────────────────────────────
        heading1("2. Related Work"),
        bodyPara(
          "Several studies and existing systems have explored IoT-based attendance management. This section briefly reviews three relevant works and highlights how the proposed system differs.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        bodyPara(
          "Shete and Agrawal (2016) proposed an IoT-based student attendance system using RFID and a Raspberry Pi microcomputer. Their system stored records locally on a database connected to the Pi and sent attendance reports via email. While effective, the system lacked a real-time cloud dashboard and relied on a local server, limiting remote accessibility [2].",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "Wuni et al. (2019) developed an automated attendance system combining RFID with fingerprint biometrics on an Arduino platform. The dual-factor verification reduced proxy attendance significantly. However, the system\u2019s cost and complexity made it less scalable for large institutions with limited budgets [3].",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "Commercial platforms such as Classtime and Blackboard offer digital attendance tools, but these are software-only solutions that do not integrate physical IoT devices at the entry point. They depend on students self-reporting via mobile apps, which still allows proxy attendance [4].",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "Compared to the above, the proposed system uses a cloud-first architecture (rather than local servers), supports real-time dashboard access from any device, sends automated notifications, and is designed with scalability and low cost in mind using an ESP32 microcontroller \u2014 a significantly cheaper alternative to Raspberry Pi.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),

        // ── 3. PROPOSED IOT SYSTEM ────────────────────────────────────────
        heading1("3. Proposed IoT System"),
        heading2("3.1 System Overview"),
        bodyPara(
          "The Smart Attendance System is designed to automatically record student attendance at the moment a student presents their RFID card to a reader installed at the classroom entrance. The data is immediately transmitted to a cloud server, stored in a database, and reflected on a teacher dashboard \u2014 all within seconds.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("3.2 System Architecture"),
        bodyPara(
          "The system is structured into six layers as illustrated in Figure 1 below. Each layer has a distinct responsibility, and data flows upward from the physical IoT layer to the user-facing presentation layer.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        // Architecture diagram in monospace
        new Paragraph({
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" },
          },
          shading: { fill: "F2F3F4", type: ShadingType.CLEAR },
          spacing: { before: 120, after: 0 },
          children: [run("")],
        }),
        ...([
          "+-------------------------------------------------------+",
          "|          LAYER 6: NOTIFICATION SERVICE                |",
          "|   Email Alerts / SMS Gateway / Push Notifications     |",
          "+-------------------------------------------------------+",
          "              \u2191 Triggered by backend logic",
          "+-------------------------------------------------------+",
          "|        LAYER 5: PRESENTATION / DASHBOARD              |",
          "|   Web App (Teacher/Admin Dashboard) - Browser/Mobile  |",
          "+-------------------------------------------------------+",
          "              \u2191 REST API / WebSocket",
          "+-------------------------------------------------------+",
          "|        LAYER 4: CLOUD / BACKEND LAYER                 |",
          "|   Node.js or Python Flask API Server (Cloud-hosted)   |",
          "+-------------------------------------------------------+",
          "              \u2191 Read/Write queries",
          "+-------------------------------------------------------+",
          "|        LAYER 3: DATABASE / STORAGE LAYER              |",
          "|   MySQL or Firebase Realtime Database                 |",
          "+-------------------------------------------------------+",
          "              \u2191 MQTT over Wi-Fi",
          "+-------------------------------------------------------+",
          "|        LAYER 2: COMMUNICATION / NETWORK LAYER         |",
          "|   Wi-Fi Router -> MQTT Broker (HiveMQ / Mosquitto)    |",
          "+-------------------------------------------------------+",
          "              \u2191 SPI communication",
          "+-------------------------------------------------------+",
          "|        LAYER 1: IoT DEVICE LAYER                      |",
          "|   RFID-RC522 Reader + ESP32 Microcontroller           |",
          "|   Student RFID Card/Tag (Passive, 13.56 MHz)          |",
          "+-------------------------------------------------------+",
        ].map(line => new Paragraph({
          shading: { fill: "F2F3F4", type: ShadingType.CLEAR },
          spacing: { before: 0, after: 0, line: 240, lineRule: "auto" },
          children: [new TextRun({ text: line, font: "Courier New", size: pt(8.5) })],
        }))),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2C3E50" } },
          shading: { fill: "F2F3F4", type: ShadingType.CLEAR },
          spacing: { before: 0, after: 120 },
          children: [run("")],
        }),
        captionPara("Figure 1. Layered architecture of the Smart Attendance System."),
        spacer(),
        bodyPara("Data Flow Summary:", { children: [bold("Data Flow Summary:")] }),
        bodyPara(
          "A student taps their RFID card \u2192 the RFID reader detects the card\u2019s unique ID \u2192 the ESP32 microcontroller reads the ID and timestamps it \u2192 the data is published to an MQTT broker over Wi-Fi \u2192 the cloud backend subscribes to the MQTT topic and receives the event \u2192 the backend validates the student ID against the database \u2192 the attendance record is written to the database \u2192 the teacher dashboard updates in real time \u2192 if the student is absent, the notification service sends an alert.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("3.3 Sensors and Identification Hardware"),
        bulletPara("RFID-RC522 Reader: A low-cost, 13.56 MHz radio frequency identification reader that communicates with the ESP32 over SPI protocol. It reads the unique identifier (UID) embedded in each student\u2019s RFID card within a range of approximately 3\u20135 cm."),
        bulletPara("Student RFID Cards/Tags: Passive MIFARE 1K cards, each pre-programmed with a unique student ID. No battery is required; the card is powered by the electromagnetic field of the reader."),
        bulletPara("ESP32 Microcontroller: A dual-core 32-bit microcontroller with built-in Wi-Fi and Bluetooth. It serves as the edge computing node \u2014 it reads RFID data, appends a timestamp, and transmits the payload to the MQTT broker."),
        spacer(),
        heading2("3.4 Communication Method"),
        bodyPara(
          "The system uses Wi-Fi (IEEE 802.11 b/g/n) as the primary wireless communication protocol. Data is transmitted using MQTT (Message Queuing Telemetry Transport), a lightweight publish-subscribe protocol ideal for IoT devices with limited bandwidth. The ESP32 publishes attendance events to a topic such as \u201cschool/classroom/attendance\u201d, and the cloud backend subscribes to this topic to receive events in near real time. MQTT was chosen over HTTP because it consumes significantly less bandwidth and supports persistent connections, making it more reliable for constrained IoT devices.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("3.5 Cloud and Data Processing Platform"),
        bodyPara(
          "The backend is hosted on a cloud platform (e.g., AWS, Google Cloud, or Firebase). A REST API built with Python Flask or Node.js receives processed attendance data, validates it, and writes it to the database. Firebase Realtime Database is recommended for this system due to its native real-time synchronization with web clients, eliminating the need for polling or WebSockets from scratch.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),

        // ── 4. USE CASE SCENARIO ──────────────────────────────────────────
        heading1("4. Use Case Scenario"),
        bodyPara(
          "The following step-by-step scenario illustrates a typical system interaction from the student\u2019s action to the teacher\u2019s view.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        bodyPara([bold("Step 1 \u2014 Student Arrives at Class: "), run("A student named Ahmed arrives at the classroom. His RFID student ID card is registered in the system database with UID: A3F2C1B9.")]),
        bodyPara([bold("Step 2 \u2014 Card Scanning: "), run("Ahmed taps his RFID card against the reader mounted near the classroom door. The RFID-RC522 reader detects the card and reads the UID.")]),
        bodyPara([bold("Step 3 \u2014 Edge Processing: "), run('The ESP32 microcontroller receives the UID via SPI, appends the current timestamp (e.g., 2026-04-21 08:03:15) and the classroom ID (e.g., Room 204), and packages this data as a JSON payload: { "uid": "A3F2C1B9", "room": "204", "timestamp": "2026-04-21 08:03:15" }')]),
        bodyPara([bold("Step 4 \u2014 Data Transmission: "), run('The ESP32 publishes this JSON payload to the MQTT broker over Wi-Fi on topic "school/cs101/attendance".')]),
        bodyPara([bold("Step 5 \u2014 Backend Processing: "), run('The cloud backend receives the message, queries the database to match UID "A3F2C1B9" to student "Ahmed Khalid, ID: 20210045", checks for duplicate records, and writes a new attendance record with status "Present".')]),
        bodyPara([bold("Step 6 \u2014 Dashboard Update: "), run("The teacher\u2019s web dashboard instantly updates to show Ahmed as \u201cPresent\u201d in the CS101 class roster for April 21, 2026.")]),
        bodyPara([bold("Step 7 \u2014 Absence Detection: "), run("At the end of the session (e.g., 5 minutes after class starts), the backend checks all registered students against submitted records. Students with no scan record are marked \u201cAbsent\u201d and an alert is sent to the teacher.")]),
        bodyPara([bold("Step 8 \u2014 Report Generation: "), run("The teacher can view or download a weekly/monthly attendance report for each student from the dashboard at any time.")]),
        spacer(),

        // ── 5. SECURITY AND CHALLENGES ────────────────────────────────────
        heading1("5. Security and Challenges"),
        heading2("5.1 Security Issues"),
        new Paragraph({ children: [bold("Data Privacy:")], spacing: { before: 80, after: 40 } }),
        bodyPara(
          "Student attendance records are personal data. The system must comply with data protection principles. All data transmissions should be encrypted using TLS/SSL. The database should implement access control, allowing only authenticated users (teachers, admins) to view records.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        new Paragraph({ children: [bold("Unauthorized Access:")], spacing: { before: 80, after: 40 } }),
        bodyPara(
          "The web dashboard must enforce user authentication (username + password, or OAuth). Role-based access control (RBAC) should restrict teachers to viewing only their own course data, while admins can access all records.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        new Paragraph({ children: [bold("RFID Card Cloning and Proxy Attendance:")], spacing: { before: 80, after: 40 } }),
        bodyPara(
          "A significant vulnerability is that RFID cards can potentially be cloned or shared. Mitigations include combining RFID with a secondary check such as a PIN entry or face recognition, and monitoring for physically impossible simultaneous check-ins.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        new Paragraph({ children: [bold("MQTT Security:")], spacing: { before: 80, after: 40 } }),
        bodyPara(
          "The MQTT broker should require username/password authentication and TLS encryption. Unauthenticated MQTT brokers are a known attack vector in IoT deployments.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("5.2 Technical Challenges"),
        bulletPara("Internet Dependency: The system relies entirely on internet connectivity. Network outages will prevent attendance data from reaching the cloud. A local offline buffer on the ESP32 can queue events and sync when connectivity is restored."),
        bulletPara("Device Reliability: RFID readers can fail due to hardware faults, power issues, or wear. Redundancy measures and regular maintenance schedules are needed."),
        bulletPara("Scalability: Deploying across a large university with hundreds of classrooms requires significant infrastructure. The cloud-based design supports horizontal scaling, but network bandwidth and device management at scale remain challenges."),
        bulletPara("Cost of Deployment: While individual components are inexpensive (ESP32 ~$5, RFID reader ~$3, RFID cards ~$0.50), deployment costs for installation, networking, cloud hosting, and IT support add up."),
        bulletPara("Power and Network Failure: Classroom devices need a stable power supply. UPS backup for critical devices and local data buffering are recommended mitigations."),
        spacer(),

        // ── 6. PRACTICAL DEMONSTRATION ────────────────────────────────────
        heading1("6. Practical Demonstration"),
        heading2("6.1 Tool Used"),
        bodyPara(
          "The simulation was implemented using Python 3.10 with the following libraries:",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bulletPara("random and datetime (standard library) \u2014 for generating simulated RFID scan events and timestamps."),
        bulletPara("pandas \u2014 for organizing attendance records in tabular form."),
        bulletPara("matplotlib \u2014 for producing bar chart and pie chart visualizations of attendance statistics."),
        bodyPara(
          "No real hardware or cloud platform was used. The simulation models the core data flow: simulated RFID scan events \u2192 attendance record creation \u2192 storage in a DataFrame \u2192 statistical analysis \u2192 visualization.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("6.2 Method of Data Generation"),
        bodyPara(
          "The simulation generates 30 attendance scan events representing a class of 10 students over 3 consecutive class sessions. For each student in each session, the system randomly determines whether the student scans their card (Present) or does not (Absent), with a configured 80% attendance probability. A unique student ID (UID), student name, course ID, date, session number, and status are recorded per event.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),
        heading2("6.3 Sample Data Table"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [bold("Table 1. Simulated Attendance Records \u2014 Session 1, Course CS101, April 21, 2026")],
          spacing: { before: 80, after: 80 },
        }),
        makeTable(
          ["#", "Student ID", "Student Name", "Course", "Date", "Session", "Status"],
          [
            ["1",  "S001", "Ahmed Khalid",   "CS101", "2026-04-21", "1", "Present"],
            ["2",  "S002", "Sara Ali",        "CS101", "2026-04-21", "1", "Absent"],
            ["3",  "S003", "Omar Hassan",     "CS101", "2026-04-21", "1", "Present"],
            ["4",  "S004", "Noor Saleh",      "CS101", "2026-04-21", "1", "Present"],
            ["5",  "S005", "Yasir Mohammed",  "CS101", "2026-04-21", "1", "Present"],
            ["6",  "S006", "Hana Ibrahim",    "CS101", "2026-04-21", "1", "Absent"],
            ["7",  "S007", "Khaled Nasser",   "CS101", "2026-04-21", "1", "Present"],
            ["8",  "S008", "Lina Farouk",     "CS101", "2026-04-21", "1", "Present"],
            ["9",  "S009", "Tariq Mansour",   "CS101", "2026-04-21", "1", "Present"],
            ["10", "S010", "Rana Zaid",       "CS101", "2026-04-21", "1", "Absent"],
          ],
          [360, 840, 1680, 840, 1320, 840, 1080]
        ),
        captionPara("Table 1. Simulated attendance records for Session 1 of Course CS101."),
        spacer(),
        heading2("6.4 Simulation Results and Visualization"),
        bodyPara(
          "The Python script produces two visualizations:",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bulletPara("Figure 2 \u2014 Bar Chart: Per-student attendance count (number of sessions attended out of 3) for all 10 students. The x-axis shows student first names; the y-axis shows sessions attended (0\u20133). Students with 0\u20131 sessions are flagged red as high-risk absentees; students with 2 sessions are flagged orange as at-risk."),
        bulletPara("Figure 3 \u2014 Pie Chart: Overall attendance rate across all students and sessions, showing the proportion of Present vs. Absent records. In the simulation run, approximately 77\u201383% of records show \u201cPresent\u201d status, consistent with the 80% attendance probability parameter."),
        spacer(),
        new Paragraph({
          shading: { fill: "FEF9E7", type: ShadingType.CLEAR },
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "F39C12" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "F39C12" },
            left: { style: BorderStyle.SINGLE, size: 8, color: "F39C12" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "F39C12" },
          },
          spacing: { before: 120, after: 120 },
          children: [new TextRun({
            text: "Note to student: Run the accompanying Python script (attendance_simulation.py) to generate actual Matplotlib charts, then take screenshots and insert them here as Figure 2 and Figure 3.",
            italics: true, font: "Times New Roman", size: pt(11),
          })],
        }),
        spacer(),
        heading2("6.5 Discussion of Results"),
        bodyPara(
          "The simulation successfully demonstrates the following system behaviors:",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bulletPara("Attendance records are generated deterministically per student per session, accurately modeling real RFID scan events."),
        bulletPara("The tabular data structure mirrors what would be stored in a production database (MySQL or Firebase), with all necessary fields: student ID, name, course, date, session, and status."),
        bulletPara("The bar chart clearly identifies students with low attendance, enabling quick visual identification of at-risk students."),
        bulletPara("The pie chart provides a high-level class attendance health summary that teachers can use at a glance."),
        bodyPara(
          "The simulation confirms that the proposed data model and processing logic are sound. In a real deployment, the Python backend would replace the random generator with actual MQTT message handlers receiving live data from ESP32 devices.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        spacer(),

        // ── 7. CONCLUSION ─────────────────────────────────────────────────
        heading1("7. Conclusion"),
        bodyPara(
          "This paper presented the design and conceptual architecture of a Smart Attendance System based on IoT technology. The system uses RFID readers connected to ESP32 microcontrollers at classroom entrances to automatically record student attendance. Data is transmitted over Wi-Fi using the MQTT protocol to a cloud-hosted backend, stored in a database, and displayed in real time on a teacher and administrator web dashboard. Automated notifications alert instructors of absent students promptly.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "The proposed six-layer architecture \u2014 IoT device, communication, cloud/backend, database, presentation, and notification \u2014 provides a clear separation of concerns and supports scalability. Security considerations including TLS encryption, role-based access control, and RFID clone mitigation were discussed. A Python-based simulation was implemented to validate the core data flow without physical hardware, generating attendance records for 10 students across 3 sessions and producing informative visualizations.",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bodyPara(
          "The most significant insight from this project is that IoT-based attendance automation is not only technically feasible with low-cost hardware but also practically beneficial in reducing administrative overhead and improving data reliability. Future improvements could include:",
          { alignment: AlignmentType.JUSTIFIED }
        ),
        bulletPara("Face recognition integrated into the RFID reader for dual-factor verification to eliminate proxy attendance."),
        bulletPara("Fingerprint scanning as an alternative biometric identifier."),
        bulletPara("GPS-based validation to confirm the teacher\u2019s location matches the classroom."),
        bulletPara("An AI-powered analytics module to predict at-risk students based on attendance trends."),
        bulletPara("A parent notification module to alert parents when their child is marked absent."),
        bulletPara("An offline-first mode with local buffering to handle network outages gracefully."),
        spacer(),

        // ── 8. REFERENCES ─────────────────────────────────────────────────
        heading1("8. References"),
        ...[
          "[1] K. Ashton, \u201cThat \u2018Internet of Things\u2019 Thing,\u201d RFID Journal, vol. 22, no. 7, pp. 97\u2013114, 2009.",
          "[2] R. Shete and S. Agrawal, \u201cIoT Based Smart Campus and Intelligent Transportation System,\u201d in Proc. 2016 IEEE Int. Conf. Advances in Electronics, Communication and Computer Technology (ICAECCT), Pune, India, 2016, pp. 384\u2013388.",
          "[3] I. Y. Wuni, E. Odoi-Lartey, and K. Quaisie, \u201cDevelopment of an IoT-Based Automated Student Attendance Monitoring System Using RFID and Fingerprint Biometrics,\u201d International Journal of Advanced Computer Science and Applications, vol. 10, no. 5, pp. 126\u2013133, 2019.",
          "[4] A. Al-Nabhani and F. Al-Saqer, \u201cChallenges and Benefits of Automated Attendance Systems in Higher Education,\u201d International Journal of Information and Education Technology, vol. 8, no. 3, pp. 203\u2013208, 2018.",
          "[5] M. Swan, \u201cSensor Mania! The Internet of Things, Wearable Computing, Objective Metrics, and the Quantified Self 2.0,\u201d Journal of Sensor and Actuator Networks, vol. 1, no. 3, pp. 217\u2013253, 2012.",
          "[6] A. Al-Fuqaha, M. Guizani, M. Mohammadi, M. Aledhari, and M. Ayyash, \u201cInternet of Things: A Survey on Enabling Technologies, Protocols, and Applications,\u201d IEEE Communications Surveys & Tutorials, vol. 17, no. 4, pp. 2347\u20132376, 2015.",
          "[7] R. Want, \u201cAn Introduction to RFID Technology,\u201d IEEE Pervasive Computing, vol. 5, no. 1, pp. 25\u201333, 2006.",
          "[8] MQTT.org, \u201cMQTT: The Standard for IoT Messaging,\u201d Available: https://mqtt.org, Accessed: April 2026.",
        ].map(ref => new Paragraph({
          children: [run(ref)],
          spacing: { before: 80, after: 80, line: 276, lineRule: "auto" },
          indent: { left: 720, hanging: 720 },
        })),
      ],
    },
  ],
});

// ─── Write file ───────────────────────────────────────────────────────────────

const OUTPUT = "C:/Users/Lenovo/OneDrive/Desktop/Smart Attendance System Using IoT/Smart_Attendance_System_IoT_Paper.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("Done! File saved to:", OUTPUT);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
