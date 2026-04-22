# =============================================================================
#  SMART ATTENDANCE SYSTEM USING IoT
#  A software simulation of an RFID-based IoT attendance system
#
#  How it maps to real IoT hardware:
#    Keyboard Input  →  RFID Card Scan
#    This Script     →  NodeMCU / ESP8266 Processing
#    CSV File        →  Cloud Database Storage
#    Charts          →  Teacher Dashboard / Analytics
#
#  Libraries required: matplotlib (pip install matplotlib)
#  Standard library:   csv, datetime, time, os, sys
# =============================================================================

import csv
import os
import sys
import time
from datetime import datetime

# Force UTF-8 output so Unicode box/symbol characters render correctly on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# matplotlib is the only external library required
try:
    import matplotlib
    matplotlib.use("Agg")          # non-interactive backend — works without a display
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False

# ─── Terminal colour codes (work on Windows 10+, macOS, Linux) ───────────────

class Color:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"

# Enable ANSI codes on Windows
if sys.platform == "win32":
    os.system("color")

# ─── Student database ─────────────────────────────────────────────────────────
# In a real IoT system this would be stored in a cloud database.
# Here it acts as the registered student roster.

STUDENTS = {
    "1001": "Ahmed",
    "1002": "Sara",
    "1003": "Omar",
    "1004": "Lina",
    "1005": "Mariam",
    "1006": "Khalid",
    "1007": "Noor",
    "1008": "Yasir",
}

# ─── File paths ───────────────────────────────────────────────────────────────

CSV_FILE              = "attendance_records.csv"
CHART_SUMMARY         = "attendance_summary.png"
CHART_PER_STUDENT     = "student_attendance.png"

# ─── Runtime attendance store ─────────────────────────────────────────────────
# Keys are student IDs; values are dicts with status and scan time.

attendance_records: dict[str, dict] = {}

# ─── Helper: print a horizontal divider ──────────────────────────────────────

def divider(char: str = "=", width: int = 54, color: str = Color.CYAN) -> None:
    print(f"{color}{char * width}{Color.RESET}")

# ─── Helper: animated "sending to cloud" simulation ──────────────────────────

def simulate_iot_pipeline() -> None:
    """Prints a realistic IoT data-pipeline animation."""
    steps = [
        ("RFID Card Detected...           ", 0.4),
        ("Connecting to Wi-Fi...          ", 0.5),
        ("Authenticating with server...   ", 0.3),
        ("Sending attendance data to cloud", 0.6),
    ]
    for msg, delay in steps:
        print(f"  {Color.YELLOW}>{Color.RESET} {msg}", end="", flush=True)
        # Simple dot animation
        for _ in range(3):
            time.sleep(delay / 3)
            print(".", end="", flush=True)
        print()
    print()

# ─── Helper: progress bar ─────────────────────────────────────────────────────

def progress_bar(label: str = "Processing", width: int = 30, delay: float = 0.03) -> None:
    print(f"  {label}: [", end="", flush=True)
    for i in range(width):
        time.sleep(delay)
        print(f"{Color.GREEN}#{Color.RESET}", end="", flush=True)
    print("] Done")

# ─── Banner ───────────────────────────────────────────────────────────────────

def print_banner() -> None:
    divider()
    print(f"{Color.BOLD}{Color.CYAN}{'SMART ATTENDANCE SYSTEM USING IoT':^54}{Color.RESET}")
    print(f"{Color.WHITE}{'Simulated RFID  |  Wi-Fi  |  Cloud Storage':^54}{Color.RESET}")
    divider()
    print()

# ─── Menu ─────────────────────────────────────────────────────────────────────

def print_menu() -> None:
    divider("-", color=Color.BLUE)
    print(f"{Color.BOLD}  MAIN MENU{Color.RESET}")
    divider("-", color=Color.BLUE)
    options = [
        ("1", "Scan RFID Card"),
        ("2", "Show Attendance Table"),
        ("3", "Generate Attendance Charts"),
        ("4", "Save Attendance to CSV"),
        ("5", "Exit System"),
    ]
    for key, label in options:
        print(f"  {Color.YELLOW}[{key}]{Color.RESET}  {label}")
    divider("-", color=Color.BLUE)

# ─── Feature 1: Scan RFID card ────────────────────────────────────────────────

def scan_rfid() -> None:
    """Simulates a student scanning an RFID card at the classroom reader."""
    divider()
    print(f"{Color.BOLD}{Color.CYAN}  [ RFID SCANNER — CLASSROOM READER ]{Color.RESET}")
    divider()
    print(f"  {Color.WHITE}Press ENTER with no input to return to menu.{Color.RESET}")
    print()

    student_id = input(
        f"  {Color.BOLD}Scan RFID Card (Enter Student ID): {Color.RESET}"
    ).strip()

    if student_id == "":
        print(f"\n  {Color.YELLOW}Returning to main menu...{Color.RESET}\n")
        return

    print()

    # ── Unknown card ──────────────────────────────────────────────────────────
    if student_id not in STUDENTS:
        print(f"  {Color.RED}{'─' * 40}{Color.RESET}")
        print(f"  {Color.RED}  ✗  Unknown RFID Card{Color.RESET}")
        print(f"  {Color.RED}     ID \"{student_id}\" is not registered in the system.{Color.RESET}")
        print(f"  {Color.RED}{'─' * 40}{Color.RESET}\n")
        return

    student_name = STUDENTS[student_id]

    # ── Duplicate scan ────────────────────────────────────────────────────────
    if student_id in attendance_records:
        recorded_time = attendance_records[student_id]["time"]
        print(f"  {Color.YELLOW}{'─' * 40}{Color.RESET}")
        print(f"  {Color.YELLOW}  ⚠  Duplicate Scan Detected{Color.RESET}")
        print(f"  {Color.YELLOW}     {student_name} already scanned at {recorded_time}.{Color.RESET}")
        print(f"  {Color.YELLOW}{'─' * 40}{Color.RESET}\n")
        return

    # ── Valid, first-time scan ────────────────────────────────────────────────
    simulate_iot_pipeline()

    scan_time = datetime.now().strftime("%I:%M %p")
    scan_date = datetime.now().strftime("%Y-%m-%d")

    attendance_records[student_id] = {
        "name":   student_name,
        "status": "Present",
        "time":   scan_time,
        "date":   scan_date,
    }

    print(f"  {Color.GREEN}{'─' * 40}{Color.RESET}")
    print(f"  {Color.GREEN}  ✓  Attendance Recorded Successfully{Color.RESET}")
    print(f"  {Color.GREEN}{'─' * 40}{Color.RESET}")
    print(f"  {Color.BOLD}  Student :{Color.RESET} {student_name}")
    print(f"  {Color.BOLD}  ID      :{Color.RESET} {student_id}")
    print(f"  {Color.BOLD}  Time    :{Color.RESET} {scan_time}")
    print(f"  {Color.BOLD}  Status  :{Color.RESET} {Color.GREEN}Present{Color.RESET}")
    print()

# ─── Feature 2: Show attendance table ─────────────────────────────────────────

def build_full_records() -> list[dict]:
    """
    Merges scanned records with the full student list.
    Students who did not scan are automatically marked Absent.
    """
    full = []
    for sid, name in STUDENTS.items():
        if sid in attendance_records:
            rec = attendance_records[sid]
            full.append({
                "id":     sid,
                "name":   name,
                "status": rec["status"],
                "time":   rec["time"],
                "date":   rec["date"],
            })
        else:
            full.append({
                "id":     sid,
                "name":   name,
                "status": "Absent",
                "time":   "---",
                "date":   datetime.now().strftime("%Y-%m-%d"),
            })
    return full

def show_attendance_table() -> None:
    """Displays all students with their attendance status in a formatted table."""
    records = build_full_records()

    divider()
    print(f"{Color.BOLD}{Color.CYAN}  ATTENDANCE TABLE — {datetime.now().strftime('%A, %d %B %Y')}{Color.RESET}")
    divider()

    # Table header
    header = f"  {'ID':<12} {'Name':<14} {'Status':<10} {'Time':<12} {'Date'}"
    print(f"{Color.BOLD}{Color.WHITE}{header}{Color.RESET}")
    divider("-", color=Color.WHITE)

    present_count = 0
    absent_count  = 0

    for rec in records:
        if rec["status"] == "Present":
            status_str = f"{Color.GREEN}{'Present':<10}{Color.RESET}"
            present_count += 1
        else:
            status_str = f"{Color.RED}{'Absent':<10}{Color.RESET}"
            absent_count += 1

        print(
            f"  {rec['id']:<12} {rec['name']:<14} "
            f"{status_str} {rec['time']:<12} {rec['date']}"
        )

    divider("-", color=Color.WHITE)
    print(
        f"  {Color.BOLD}Total: {len(records)} students  |  "
        f"{Color.GREEN}Present: {present_count}{Color.RESET}  |  "
        f"{Color.RED}Absent: {absent_count}{Color.RESET}"
    )
    divider()
    print()

# ─── Feature 3: Generate charts ───────────────────────────────────────────────

def generate_charts() -> None:
    """
    Produces two PNG charts:
      1. attendance_summary.png   — bar chart of Present vs Absent totals
      2. student_attendance.png   — per-student status bar chart
    """
    if not MATPLOTLIB_AVAILABLE:
        print(f"\n  {Color.RED}matplotlib is not installed.{Color.RESET}")
        print(f"  Run: pip install matplotlib\n")
        return

    records = build_full_records()
    names   = [r["name"]   for r in records]
    status  = [r["status"] for r in records]

    present_count = status.count("Present")
    absent_count  = status.count("Absent")

    progress_bar("Generating charts", delay=0.02)
    print()

    # ── Chart 1: Summary bar chart ────────────────────────────────────────────
    fig1, ax1 = plt.subplots(figsize=(7, 5))
    fig1.patch.set_facecolor("#1A1A2E")
    ax1.set_facecolor("#16213E")

    bars = ax1.bar(
        ["Present", "Absent"],
        [present_count, absent_count],
        color=["#2ECC71", "#E74C3C"],
        width=0.45,
        edgecolor="#FFFFFF",
        linewidth=0.8,
    )

    # Value labels on bars
    for bar, val in zip(bars, [present_count, absent_count]):
        ax1.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.08,
            str(val),
            ha="center", va="bottom",
            color="white", fontsize=14, fontweight="bold",
        )

    ax1.set_title(
        "Attendance Summary\nPresent vs Absent Students",
        color="white", fontsize=13, fontweight="bold", pad=15,
    )
    ax1.set_ylabel("Number of Students", color="#AAAAAA", fontsize=11)
    ax1.set_ylim(0, len(records) + 1)
    ax1.tick_params(colors="white", labelsize=12)
    ax1.spines[:].set_color("#444444")

    # Attendance rate text
    rate = present_count / len(records) * 100 if records else 0
    ax1.text(
        0.98, 0.96,
        f"Attendance Rate: {rate:.1f}%",
        transform=ax1.transAxes,
        ha="right", va="top",
        color="#F0F0F0", fontsize=10,
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#0F3460", edgecolor="#2ECC71", linewidth=1.2),
    )

    # Legend
    legend_patches = [
        mpatches.Patch(color="#2ECC71", label=f"Present ({present_count})"),
        mpatches.Patch(color="#E74C3C", label=f"Absent ({absent_count})"),
    ]
    ax1.legend(handles=legend_patches, facecolor="#1A1A2E", edgecolor="#444444",
               labelcolor="white", fontsize=10, loc="upper right")

    fig1.tight_layout()
    fig1.savefig(CHART_SUMMARY, dpi=150, bbox_inches="tight",
                 facecolor=fig1.get_facecolor())
    plt.close(fig1)
    print(f"  {Color.GREEN}✓{Color.RESET}  Saved: {Color.CYAN}{CHART_SUMMARY}{Color.RESET}")

    # ── Chart 2: Per-student attendance ───────────────────────────────────────
    fig2, ax2 = plt.subplots(figsize=(10, 5))
    fig2.patch.set_facecolor("#1A1A2E")
    ax2.set_facecolor("#16213E")

    colors_per_student = ["#2ECC71" if s == "Present" else "#E74C3C" for s in status]
    x_pos = range(len(names))

    bars2 = ax2.bar(
        x_pos,
        [1] * len(names),
        color=colors_per_student,
        edgecolor="#FFFFFF",
        linewidth=0.6,
    )

    for bar, s in zip(bars2, status):
        label = "P" if s == "Present" else "A"
        ax2.text(
            bar.get_x() + bar.get_width() / 2,
            0.5,
            label,
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
    ax2.legend(handles=legend_patches2, facecolor="#1A1A2E", edgecolor="#444444",
               labelcolor="white", fontsize=10)

    fig2.tight_layout()
    fig2.savefig(CHART_PER_STUDENT, dpi=150, bbox_inches="tight",
                 facecolor=fig2.get_facecolor())
    plt.close(fig2)
    print(f"  {Color.GREEN}✓{Color.RESET}  Saved: {Color.CYAN}{CHART_PER_STUDENT}{Color.RESET}")
    print()

# ─── Feature 4: Save to CSV ───────────────────────────────────────────────────

def save_to_csv() -> None:
    """
    Exports the full attendance table to a CSV file.
    In a real IoT system, this represents the cloud database record.
    """
    records = build_full_records()

    progress_bar("Uploading to cloud database", delay=0.025)
    print()

    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["Student ID", "Student Name", "Status", "Time", "Date"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for rec in records:
            writer.writerow({
                "Student ID":   rec["id"],
                "Student Name": rec["name"],
                "Status":       rec["status"],
                "Time":         rec["time"],
                "Date":         rec["date"],
            })

    present_count = sum(1 for r in records if r["status"] == "Present")
    absent_count  = len(records) - present_count

    print(f"  {Color.GREEN}✓{Color.RESET}  Attendance saved to: {Color.CYAN}{CSV_FILE}{Color.RESET}")
    print(f"  {Color.WHITE}  Records written : {len(records)}{Color.RESET}")
    print(f"  {Color.GREEN}  Present         : {present_count}{Color.RESET}")
    print(f"  {Color.RED}  Absent          : {absent_count}{Color.RESET}")
    print()

# ─── Feature 5: Exit ──────────────────────────────────────────────────────────

def exit_system() -> None:
    """Prompts for confirmation then exits gracefully."""
    print()
    confirm = input(
        f"  {Color.YELLOW}Are you sure you want to exit? (y/n): {Color.RESET}"
    ).strip().lower()

    if confirm == "y":
        print()
        divider()
        print(f"{Color.BOLD}{Color.CYAN}{'SYSTEM SHUTTING DOWN':^54}{Color.RESET}")
        print(f"{Color.WHITE}{'Thank you for using Smart Attendance System':^54}{Color.RESET}")
        divider()
        print()
        sys.exit(0)
    else:
        print(f"\n  {Color.GREEN}Returning to main menu...{Color.RESET}\n")

# ─── Main loop ────────────────────────────────────────────────────────────────

def main() -> None:
    """Application entry point — clears screen, shows banner, runs menu loop."""
    # Clear terminal for a clean start
    os.system("cls" if sys.platform == "win32" else "clear")
    print_banner()

    # Show current session info
    print(f"  {Color.WHITE}Session Date : {datetime.now().strftime('%A, %d %B %Y')}{Color.RESET}")
    print(f"  {Color.WHITE}Session Time : {datetime.now().strftime('%I:%M %p')}{Color.RESET}")
    print(f"  {Color.WHITE}Students Reg : {len(STUDENTS)}{Color.RESET}")
    print()

    # Map menu choices to handler functions
    menu_actions = {
        "1": scan_rfid,
        "2": show_attendance_table,
        "3": generate_charts,
        "4": save_to_csv,
        "5": exit_system,
    }

    while True:
        print_menu()
        choice = input(
            f"  {Color.BOLD}Select an option [1-5]: {Color.RESET}"
        ).strip()
        print()

        if choice in menu_actions:
            menu_actions[choice]()
        else:
            print(f"  {Color.RED}Invalid option. Please enter a number between 1 and 5.{Color.RESET}\n")

# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    main()
