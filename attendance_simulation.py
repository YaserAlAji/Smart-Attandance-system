"""
Smart Attendance System - IoT Simulation
Simulates RFID-based attendance scanning for 10 students over 3 sessions.
Generates a data table and two visualizations (bar chart + pie chart).

Requirements: pip install pandas matplotlib
"""

import random
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import date, timedelta

# ─── Configuration ────────────────────────────────────────────────────────────

random.seed(42)  # Fixed seed for reproducible results

STUDENTS = [
    {"id": "S001", "name": "Ahmed Khalid",   "uid": "A3F2C1B9"},
    {"id": "S002", "name": "Sara Ali",        "uid": "B7E4D2A1"},
    {"id": "S003", "name": "Omar Hassan",     "uid": "C1A9F3E5"},
    {"id": "S004", "name": "Noor Saleh",      "uid": "D5B2C8F7"},
    {"id": "S005", "name": "Yasir Mohammed",  "uid": "E9C6A4B3"},
    {"id": "S006", "name": "Hana Ibrahim",    "uid": "F3D1E7C2"},
    {"id": "S007", "name": "Khaled Nasser",   "uid": "A8E5B9D4"},
    {"id": "S008", "name": "Lina Farouk",     "uid": "B2F7C3A6"},
    {"id": "S009", "name": "Tariq Mansour",   "uid": "C6A1D8F2"},
    {"id": "S010", "name": "Rana Zaid",       "uid": "D4B9E2C7"},
]

SESSIONS = [
    {"session": 1, "date": date(2026, 4, 21), "time": "08:00", "course": "CS101"},
    {"session": 2, "date": date(2026, 4, 23), "time": "08:00", "course": "CS101"},
    {"session": 3, "date": date(2026, 4, 25), "time": "08:00", "course": "CS101"},
]

ATTENDANCE_PROBABILITY = 0.80  # 80% chance a student attends each session

# ─── Simulate RFID Scan Events ────────────────────────────────────────────────

print("=" * 60)
print("   Smart IoT Attendance System — Python Simulation")
print("=" * 60)
print(f"\nSimulating {len(STUDENTS)} students × {len(SESSIONS)} sessions ...\n")

records = []
for sess in SESSIONS:
    for student in STUDENTS:
        present = random.random() < ATTENDANCE_PROBABILITY
        status = "Present" if present else "Absent"

        # Simulate MQTT JSON payload (what ESP32 would publish)
        if present:
            scan_time = f"{sess['time']}:{random.randint(0, 59):02d}"
            payload = {
                "uid": student["uid"],
                "room": "204",
                "timestamp": f"{sess['date']} {scan_time}"
            }
        else:
            payload = None  # No scan event for absent student

        records.append({
            "Record #":    len(records) + 1,
            "Student ID":  student["id"],
            "Student Name": student["name"],
            "UID":         student["uid"],
            "Course":      sess["course"],
            "Date":        str(sess["date"]),
            "Session":     sess["session"],
            "Scan Time":   f"{sess['time']}:{random.randint(0,59):02d}" if present else "—",
            "Status":      status,
            "MQTT Payload": str(payload) if payload else "No event",
        })

df = pd.DataFrame(records)

# ─── Print Full Attendance Table ──────────────────────────────────────────────

print("TABLE 1 — Full Simulated Attendance Records")
print("-" * 90)
display_cols = ["Record #", "Student ID", "Student Name", "Course", "Date", "Session", "Status"]
print(df[display_cols].to_string(index=False))
print()

# ─── Per-student summary ──────────────────────────────────────────────────────

summary = df.groupby(["Student ID", "Student Name"])["Status"].apply(
    lambda x: (x == "Present").sum()
).reset_index()
summary.columns = ["Student ID", "Student Name", "Sessions Attended"]
summary["Sessions Total"] = len(SESSIONS)
summary["Attendance %"] = (summary["Sessions Attended"] / len(SESSIONS) * 100).round(1)
summary["Risk Level"] = summary["Sessions Attended"].apply(
    lambda x: "HIGH RISK" if x <= 1 else ("AT RISK" if x == 2 else "OK")
)

print("TABLE 2 — Per-Student Attendance Summary")
print("-" * 70)
print(summary.to_string(index=False))
print()

# ─── Overall statistics ───────────────────────────────────────────────────────

total = len(df)
present_count = (df["Status"] == "Present").sum()
absent_count  = (df["Status"] == "Absent").sum()
attendance_rate = present_count / total * 100

print(f"Overall Statistics:")
print(f"  Total records   : {total}")
print(f"  Present         : {present_count}  ({attendance_rate:.1f}%)")
print(f"  Absent          : {absent_count}  ({100 - attendance_rate:.1f}%)")
print()

# ─── Figure 1: Bar Chart — Sessions Attended per Student ─────────────────────

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle(
    "Smart Attendance System — IoT Simulation Results\nCourse: CS101 | 10 Students | 3 Sessions",
    fontsize=13, fontweight="bold", y=1.01
)

# Color bars by risk level
colors = []
for val in summary["Sessions Attended"]:
    if val <= 1:
        colors.append("#E74C3C")   # red = high risk
    elif val == 2:
        colors.append("#F39C12")   # orange = at risk
    else:
        colors.append("#27AE60")   # green = ok

short_names = [n.split()[0] for n in summary["Student Name"]]

bars = axes[0].bar(short_names, summary["Sessions Attended"], color=colors,
                   edgecolor="white", linewidth=0.8, zorder=3)

for bar, val in zip(bars, summary["Sessions Attended"]):
    axes[0].text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                 f"{val}/{len(SESSIONS)}", ha="center", va="bottom",
                 fontsize=9, fontweight="bold")

axes[0].set_title("Figure 2 — Sessions Attended per Student", fontsize=11, fontweight="bold")
axes[0].set_xlabel("Student (First Name)", fontsize=10)
axes[0].set_ylabel("Sessions Attended (out of 3)", fontsize=10)
axes[0].set_ylim(0, len(SESSIONS) + 0.7)
axes[0].set_yticks(range(len(SESSIONS) + 1))
axes[0].axhline(y=2, color="gray", linestyle="--", linewidth=0.8, alpha=0.6,
                label="Minimum threshold (2/3)")
axes[0].grid(axis="y", linestyle="--", alpha=0.4, zorder=0)
axes[0].tick_params(axis="x", rotation=30)

legend_patches = [
    mpatches.Patch(color="#27AE60", label="OK (3/3)"),
    mpatches.Patch(color="#F39C12", label="At Risk (2/3)"),
    mpatches.Patch(color="#E74C3C", label="High Risk (≤1/3)"),
]
axes[0].legend(handles=legend_patches, loc="upper right", fontsize=8)

# ─── Figure 2: Pie Chart — Overall Attendance Rate ───────────────────────────

pie_labels = [f"Present\n{present_count} records\n({attendance_rate:.1f}%)",
              f"Absent\n{absent_count} records\n({100 - attendance_rate:.1f}%)"]
pie_colors = ["#27AE60", "#E74C3C"]
pie_explode = (0.05, 0.05)

wedges, texts = axes[1].pie(
    [present_count, absent_count],
    labels=pie_labels,
    colors=pie_colors,
    explode=pie_explode,
    startangle=90,
    textprops={"fontsize": 10},
    wedgeprops={"edgecolor": "white", "linewidth": 2}
)

axes[1].set_title("Figure 3 — Overall Attendance Rate\n(All Students, All Sessions)",
                  fontsize=11, fontweight="bold")

# ─── Session breakdown inset ──────────────────────────────────────────────────

session_stats = df.groupby("Session")["Status"].apply(
    lambda x: round((x == "Present").sum() / len(x) * 100, 1)
).reset_index()
session_stats.columns = ["Session", "Attendance %"]

table_data = [[f"Session {row['Session']}", f"{row['Attendance %']}%"]
              for _, row in session_stats.iterrows()]

tbl = axes[1].table(
    cellText=table_data,
    colLabels=["Session", "Rate"],
    cellLoc="center",
    loc="lower center",
    bbox=[0.25, -0.28, 0.5, 0.22]
)
tbl.auto_set_font_size(False)
tbl.set_fontsize(9)
for (r, c), cell in tbl.get_celld().items():
    if r == 0:
        cell.set_facecolor("#2C3E50")
        cell.set_text_props(color="white", fontweight="bold")
    else:
        cell.set_facecolor("#ECF0F1")

plt.tight_layout(pad=2.0)

# Save figure
output_path = "attendance_charts.png"
plt.savefig(output_path, dpi=150, bbox_inches="tight",
            facecolor="white", edgecolor="none")
print(f"Charts saved to: {output_path}")
print("Take a screenshot of the charts and insert them into your Word document.")
print("\nSimulation complete.")

plt.show()
