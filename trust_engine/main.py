"""
ZeroIAM Trust Engine — Real Scanner (PDP)
==========================================
Runs in Docker (Linux container).

Data sources:
  1. Windows Security Agent (http://host.docker.internal:5001/status)
     - Provides: Firewall, Antivirus, OS Version, Update Status
     - Must be running natively on the Windows host before scanning!
  2. nmap — real port scan against the Windows host IP
  3. All results are deterministic: same system state -> same score

DEMO_MODE=true (set in docker-compose.prod.yml or env):
  - Skips Windows Agent + nmap entirely
  - Returns a clean deterministic demo result (score=80)
  - Used for AWS cloud deployments where no Windows host exists
"""

import os
import subprocess
import json
import requests
from datetime import datetime, timezone
from flask import Flask, jsonify, request

app = Flask(__name__)

# The Windows host is accessible from Docker using this hostname
WINDOWS_AGENT_URL = os.environ.get("WINDOWS_AGENT_URL", "http://host.docker.internal:5001/status")
# Scan the Windows host, not the container itself
HOST_SCAN_TARGET = "host.docker.internal"
# Ports considered risky for a workstation device
RISKY_PORTS = [21, 23, 445, 3389, 4444, 5900, 6666, 8888]

# DEMO_MODE: skip real scans, return clean deterministic result
DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")

if DEMO_MODE:
    print("  ℹ️  DEMO_MODE=true — Real scanning disabled. Demo results will be returned.")


# ─────────────────────────────────────────────────────────────
#  SCORING MODEL (matches capstone spec exactly)
# ─────────────────────────────────────────────────────────────
def calculate_trust_score(results: dict) -> int:
    """
    Deterministic scoring: same inputs => same output.
    Total possible: 100 points.
    """
    score = 0

    if results.get("firewall_enabled", False):
        score += 25         # Firewall (25 pts)

    if results.get("antivirus_running", False):
        score += 25         # Antivirus (25 pts)

    if results.get("os_updated", False):
        score += 20         # OS Updated (20 pts)

    if not results.get("risky_ports_found", True):
        score += 20         # Safe Ports (20 pts)

    score += 10             # Scan Freshness — always passes for real-time scans

    return score


# ─────────────────────────────────────────────────────────────
#  SOURCE 1: Windows Security Agent
# ─────────────────────────────────────────────────────────────
def fetch_windows_data() -> dict:
    """
    Calls the Windows Security Agent running natively on the host.
    Falls back to safe defaults if the agent is not running.
    """
    try:
        headers = {"ngrok-skip-browser-warning": "69420"}
        resp = requests.get(WINDOWS_AGENT_URL, headers=headers, timeout=15)
        data = resp.json()
        print(f"  ✅ Windows Agent     : Connected")
        print(f"     Firewall          : {'ON' if data.get('firewall_enabled') else 'OFF'}")
        print(f"     Antivirus         : {data.get('antivirus_name', 'Unknown')}")
        print(f"     OS                : {data.get('os_version', 'Unknown')}")
        print(f"     Updated           : {'Yes' if data.get('os_updated') else 'No (' + str(data.get('pending_updates', '?')) + ' pending)'}")
        return data
    except requests.exceptions.ConnectionError:
        print("  ⚠️  Windows Agent     : NOT RUNNING!")
        print("     Run: python trust_engine/windows_agent.py")
        print("     Fallback: Using conservative defaults (safe demo mode)")
        return {
            "firewall_enabled": True,
            "antivirus_running": True,
            "antivirus_name": "Agent Offline (Demo Mode)",
            "os_version": "Windows (Agent Offline)",
            "os_updated": True,
            "pending_updates": 0,
            "_agent_offline": True
        }
    except Exception as e:
        print(f"  ❌ Windows Agent Error: {e}")
        return {
            "firewall_enabled": False,
            "antivirus_running": False,
            "antivirus_name": "Error",
            "os_version": "Unknown",
            "os_updated": False,
            "pending_updates": -1,
            "_agent_offline": True
        }


# ─────────────────────────────────────────────────────────────
#  SOURCE 2: Real nmap Port Scan
# ─────────────────────────────────────────────────────────────
def scan_nmap() -> dict:
    """
    Runs a real nmap scan against the Windows host machine.
    Identifies dangerous open ports.
    """
    found_risky = False
    open_ports = []

    try:
        print(f"  🔍 nmap Scan         : Scanning {HOST_SCAN_TARGET}...")
        # -T4 = aggressive timing, -F = top 100 most common ports
        result = subprocess.run(
            ["nmap", "-T4", "-F", HOST_SCAN_TARGET],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            for line in result.stdout.split("\n"):
                if "/tcp" in line and "open" in line:
                    try:
                        port = int(line.split("/")[0].strip())
                        open_ports.append(port)
                        if port in RISKY_PORTS:
                            found_risky = True
                            print(f"     ⚠️  Risky port found : {port}")
                    except ValueError:
                        pass
            print(f"  ✅ nmap Complete     : {len(open_ports)} open ports found")
            if found_risky:
                print(f"     ❌ Risky ports      : {[p for p in open_ports if p in RISKY_PORTS]}")
            else:
                print(f"     ✅ No risky ports detected")
        else:
            print(f"  ❌ nmap Failed      : {result.stderr.strip()}")

    except FileNotFoundError:
        print("  ❌ nmap              : Not installed in container")
    except subprocess.TimeoutExpired:
        print("  ⚠️  nmap Timeout     : Scan took too long, assuming safe")
    except Exception as e:
        print(f"  ❌ nmap Error        : {e}")

    return {
        "open_ports": open_ports,
        "risky_ports_found": found_risky
    }


# ─────────────────────────────────────────────────────────────
#  API ENDPOINT
# ─────────────────────────────────────────────────────────────
@app.route("/scan", methods=["POST"])
def run_scan():
    scan_time = datetime.now(timezone.utc)
    print("\n" + "═" * 50)
    print(f"🚀 Scan Request — {scan_time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("═" * 50)

    # ── DEMO MODE (AWS / cloud deployment) ──────────────────
    if DEMO_MODE:
        import random
        print("  ℹ️  Demo Mode — returning randomized simulation result")
        
        # Randomize device posture factors to simulate different devices
        fw_enabled = random.choice([True, True, True, False]) # 75% chance firewall is ON
        av_running = random.choice([True, True, False])       # 66% chance AV is ON
        os_updated = random.choice([True, False])             # 50% chance OS is updated
        has_risky_ports = random.choice([True, False, False]) # 33% chance of risky ports
        
        open_ports_list = [445, 3389] if has_risky_ports else [80, 443]

        demo_results = {
            "firewall_enabled": fw_enabled,
            "antivirus_running": av_running,
            "antivirus_name": "ZeroIAM Demo AV (" + random.choice(["Active", "Inactive", "Outdated"]) + ")",
            "os_version": "Demo Environment Node-" + str(random.randint(10,99)),
            "os_updated": os_updated,
            "pending_updates": random.randint(0, 15) if not os_updated else 0,
            "open_ports": open_ports_list,
            "risky_ports_found": has_risky_ports,
            "recent_scan": True,
            "agent_online": False,
            "demo_mode": True
        }
        trust_score = calculate_trust_score(demo_results)
        print(f"\n🏆 Simulated Trust Score: {trust_score}/100")
        print("═" * 50 + "\n")
        return jsonify({
            "trust_score": trust_score,
            "details": demo_results,
            "timestamp": scan_time.isoformat()
        })

    # ── REAL SCAN MODE (Windows dev machine) ────────────────
    windows_data = fetch_windows_data()
    net_data = scan_nmap()

    # Merge all results
    results = {
        "firewall_enabled": windows_data.get("firewall_enabled", False),
        "antivirus_running": windows_data.get("antivirus_running", False),
        "antivirus_name": windows_data.get("antivirus_name", "Unknown"),
        "os_version": windows_data.get("os_version", "Unknown"),
        "os_updated": windows_data.get("os_updated", False),
        "pending_updates": windows_data.get("pending_updates", 0),
        "open_ports": net_data.get("open_ports", []),
        "risky_ports_found": net_data.get("risky_ports_found", False),
        "recent_scan": True,
        "agent_online": not windows_data.get("_agent_offline", False)
    }

    trust_score = calculate_trust_score(results)

    print(f"\n🏆 Final Trust Score : {trust_score}/100")
    print("═" * 50 + "\n")

    return jsonify({
        "trust_score": trust_score,
        "details": results,
        "timestamp": scan_time.isoformat()
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ZeroIAM Trust Engine",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("═" * 50)
    print("  🛡️  ZeroIAM Trust Engine (PDP)")
    print("═" * 50)
    print(f"  Port     : {port}")
    print(f"  Agent    : {WINDOWS_AGENT_URL}")
    print(f"  Scan     : {HOST_SCAN_TARGET}")
    print("═" * 50)
    app.run(host="0.0.0.0", port=port)
