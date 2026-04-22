"""
One-time helper script: generates sample CSV and chart PNG files
so the project folder is complete without needing to run main.py first.
Run once: python generate_samples.py
"""

import csv
import os
import sys
from datetime import datetime

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
except ImportError:
    print("matplotlib not installed. Run: pip install matplotlib")
    sys.exit(1)

# ─── Sample data (mirrors STUDENTS in main.py) ────────────────────────────────

SAMPLE_RECORDS = [
    {"id": "1001", "name": "Ahmed",  "status": "Present", "time": "08:01 AM", "date": "2026-04-21"},
    {"id": "1002", "name": "Sara",   "status": "Present", "time": "08:04 AM", "date": "2026-04-21"},
    {"id": "1003", "name": "Omar",   "status": "Absent",  "time": "---",      "date": "2026-04-21"},
    {"id": "1004", "name": "Lina",   "status": "Present", "time": "08:07 AM", "date": "2026-04-21"},
    {"id": "1005", "name": "Mariam", "status": "Present", "time": "08:09 AM", "date": "2026-04-21"},
    {"id": "1006", "name": "Khalid", "status": "Absent",  "time": "---",      "date": "2026-04-21"},
    {"id": "1007", "name": "Noor",   "status": "Present", "time": "08:12 AM", "date": "2026-04-21"},
    {"id": "1008", "name": "Yasir",  "status": "Present", "time": "08:15 AM", "date": "2026-04-21"},
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── CSV ──────────────────────────────────────────────────────────────────────

csv_path = os.path.join(BASE_DIR, "attendance_records.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["Student ID", "Student Name", "Status", "Time", "Date"]
    )
    writer.writeheader()
    for r in SAMPLE_RECORDS:
        writer.writerow({
            "Student ID":   r["id"],
            "Student Name": r["name"],
            "Status":       r["status"],
            "Time":         r["time"],
            "Date":         r["date"],
        })
print(f"Saved: {csv_path}")

# ─── Chart helpers ────────────────────────────────────────────────────────────

names   = [r["name"]   for r in SAMPLE_RECORDS]
status  = [r["status"] for r in SAMPLE_RECORDS]
present = status.count("Present")
absent  = status.count("Absent")
total   = len(SAMPLE_RECORDS)
rate    = present / total * 100

# ─── Chart 1: attendance_summary.png ─────────────────────────────────────────

fig1, ax1 = plt.subplots(figsize=(7, 5))
fig1.patch.set_facecolor("#1A1A2E")
ax1.set_facecolor("#16213E")

bars = ax1.bar(
    ["Present", "Absent"],
    [present, absent],
    color=["#2ECC71", "#E74C3C"],
    width=0.45,
    edgecolor="#FFFFFF",
    linewidth=0.8,
)
for bar, val in zip(bars, [present, absent]):
    ax1.text(
        bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.08,
        str(val), ha="center", va="bottom",
        color="white", fontsize=14, fontweight="bold",
    )

ax1.set_title(
    "Attendance Summary\nPresent vs Absent Students",
    color="white", fontsize=13, fontweight="bold", pad=15,
)
ax1.set_ylabel("Number of Students", color="#AAAAAA", fontsize=11)
ax1.set_ylim(0, total + 1)
ax1.tick_params(colors="white", labelsize=12)
ax1.spines[:].set_color("#444444")

ax1.text(
    0.98, 0.96,
    f"Attendance Rate: {rate:.1f}%",
    transform=ax1.transAxes, ha="right", va="top",
    color="#F0F0F0", fontsize=10,
    bbox=dict(boxstyle="round,pad=0.4", facecolor="#0F3460",
              edgecolor="#2ECC71", linewidth=1.2),
)

legend_patches = [
    mpatches.Patch(color="#2ECC71", label=f"Present ({present})"),
    mpatches.Patch(color="#E74C3C", label=f"Absent ({absent})"),
]
ax1.legend(handles=legend_patches, facecolor="#1A1A2E",
           edgecolor="#444444", labelcolor="white", fontsize=10)

fig1.tight_layout()
chart1_path = os.path.join(BASE_DIR, "attendance_summary.png")
fig1.savefig(chart1_path, dpi=150, bbox_inches="tight",
             facecolor=fig1.get_facecolor())
plt.close(fig1)
print(f"Saved: {chart1_path}")

# ─── Chart 2: student_attendance.png ─────────────────────────────────────────

fig2, ax2 = plt.subplots(figsize=(10, 5))
fig2.patch.set_facecolor("#1A1A2E")
ax2.set_facecolor("#16213E")

colors_per_student = ["#2ECC71" if s == "Present" else "#E74C3C" for s in status]
x_pos = range(len(names))

bars2 = ax2.bar(
    x_pos, [1] * len(names),
    color=colors_per_student,
    edgecolor="#FFFFFF", linewidth=0.6,
)
for bar, s in zip(bars2, status):
    ax2.text(
        bar.get_x() + bar.get_width() / 2, 0.5,
        "P" if s == "Present" else "A",
        ha="center", va="center",
        color="white", fontsize=12, fontweight="bold",
    )

ax2.set_xticks(list(x_pos))
ax2.set_xticklabels(names, rotation=30, ha="right", color="white", fontsize=10)
ax2.set_yticks([])
ax2.set_title(
    "Per-Student Attendance Status\n(P = Present  |  A = Absent)",
    color="white", fontsize=13, fontweight="bold", pad=15,
)
ax2.spines[:].set_color("#444444")
ax2.tick_params(colors="white")

legend_patches2 = [
    mpatches.Patch(color="#2ECC71", label="Present"),
    mpatches.Patch(color="#E74C3C", label="Absent"),
]
ax2.legend(handles=legend_patches2, facecolor="#1A1A2E",
           edgecolor="#444444", labelcolor="white", fontsize=10)

fig2.tight_layout()
chart2_path = os.path.join(BASE_DIR, "student_attendance.png")
fig2.savefig(chart2_path, dpi=150, bbox_inches="tight",
             facecolor=fig2.get_facecolor())
plt.close(fig2)
print(f"Saved: {chart2_path}")

print("\nAll sample files generated successfully.")
