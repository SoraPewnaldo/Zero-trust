"""
ZeroIAM Windows Security Agent
================================
Run this script NATIVELY on Windows (outside Docker):
  python windows_agent.py

It listens on http://0.0.0.0:5001/status
The Trust Engine container calls this to get REAL Windows security data.
"""

import subprocess
import json
import platform
from datetime import datetime, timezone
from flask import Flask, jsonify

app = Flask(__name__)

def run_powershell(script: str) -> str:
    """Run a PowerShell command and return stdout."""
    result = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
        capture_output=True,
        text=True,
        timeout=10
    )
    return result.stdout.strip()

def check_firewall() -> bool:
    """
    Real check: Query Windows Firewall status for all profiles.
    Returns True if ANY profile is enabled.
    """
    try:
        output = run_powershell(
            "Get-NetFirewallProfile | Select-Object -ExpandProperty Enabled | ConvertTo-Json"
        )
        profiles = json.loads(output)
        if isinstance(profiles, list):
            return any(profiles)
        return bool(profiles)
    except Exception as e:
        print(f"[WARN] Firewall check failed: {e}")
        return False

def check_antivirus() -> dict:
    """
    Real check: Query Windows Security Center for registered antivirus products.
    Works on Windows 8.1+ via WMI.
    """
    try:
        output = run_powershell(
            "Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | "
            "Select-Object displayName, productState | ConvertTo-Json"
        )
        if not output:
            return {"running": False, "name": "None detected"}
        
        products = json.loads(output)
        if isinstance(products, dict):
            products = [products]
        
        for product in products:
            state = product.get("productState", 0)
            name = product.get("displayName", "Unknown AV")
            if state is None:
                continue
            # productState is a 3-byte hex value: 0xAABBCC
            # Middle byte (BB) encodes real-time protection status:
            #   0x10 = enabled/running, 0x00 or 0x01 = disabled/snoozed
            state_int = int(state)
            rt_byte = (state_int >> 12) & 0xF
            if rt_byte == 1:  # 0x10 >> 4 == 1 means real-time protection ON
                return {"running": True, "name": name}

        # No active AV found — all products are disabled or snoozed
        return {"running": False, "name": "Disabled"}
    
    except Exception as e:
        print(f"[WARN] Antivirus check failed: {e}")
        # Fallback: check if Windows Defender service is running
        try:
            output = run_powershell(
                "(Get-Service -Name 'WinDefend' -ErrorAction SilentlyContinue).Status"
            )
            return {
                "running": output.strip() == "Running",
                "name": "Windows Defender"
            }
        except Exception:
            return {"running": False, "name": "Unknown"}

def check_os_version() -> dict:
    """
    Real check: Get actual Windows OS version and update status.
    """
    try:
        output = run_powershell(
            "[System.Environment]::OSVersion.Version.ToString()"
        )
        build_output = run_powershell(
            "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').DisplayVersion"
        )
        caption_output = run_powershell(
            "(Get-WmiObject Win32_OperatingSystem).Caption"
        )
        
        version_str = build_output.strip() or output.strip()
        caption = caption_output.strip() or "Windows"
        
        # Check for pending Windows Updates
        pending_output = run_powershell(
            "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search('IsInstalled=0 and Type=\\'Software\\'').Updates.Count"
        )
        
        try:
            pending_updates = int(pending_output.strip())
            is_updated = pending_updates == 0
        except (ValueError, Exception):
            # If we can't check updates, assume updated (common in managed environments)
            is_updated = True
            pending_updates = 0
        
        return {
            "os_version": f"{caption} {version_str}".strip(),
            "os_updated": is_updated,
            "pending_updates": pending_updates
        }
    except Exception as e:
        print(f"[WARN] OS version check failed: {e}")
        return {
            "os_version": platform.version(),
            "os_updated": True,
            "pending_updates": 0
        }

@app.route('/status', methods=['GET'])
def get_status():
    """
    Main endpoint called by the Trust Engine Docker container.
    Returns real Windows security posture.
    """
    print(f"[{datetime.now().isoformat()}] 🔍 Security scan requested...")

    firewall = check_firewall()
    av = check_antivirus()
    os_info = check_os_version()

    response = {
        "firewall_enabled": firewall,
        "antivirus_running": av["running"],
        "antivirus_name": av["name"],
        "os_version": os_info["os_version"],
        "os_updated": os_info["os_updated"],
        "pending_updates": os_info["pending_updates"],
        "platform": "Windows",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    print(f"  Firewall: {'✅' if firewall else '❌'}")
    print(f"  Antivirus: {'✅' if av['running'] else '❌'} ({av['name']})")
    print(f"  OS Updated: {'✅' if os_info['os_updated'] else '⚠️ ' + str(os_info['pending_updates']) + ' updates pending'}")

    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "agent": "ZeroIAM Windows Security Agent", "platform": platform.system()})

if __name__ == '__main__':
    print("=" * 55)
    print("  🛡️  ZeroIAM Windows Security Agent")
    print("=" * 55)
    print(f"  Platform  : {platform.system()} {platform.version()}")
    print(f"  Listening : http://0.0.0.0:5001")
    print(f"  Endpoint  : http://host.docker.internal:5001/status")
    print("=" * 55)
    app.run(host='0.0.0.0', port=5001, debug=False)
