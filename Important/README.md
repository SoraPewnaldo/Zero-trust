
<img src="https://img.shields.io/badge/MongoDB-4DB33D?style=for-the-badge&logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">



# 🔐 Automated Trust Scoring Engine for Zero Trust Access

A fullstack cybersecurity project implementing **Zero Trust Architecture** to secure enterprise remote access using **dynamic device trust evaluation** and **role-based access control**.

This system is designed for **enterprise remote employees, administrators, and MSP environments**, where access decisions are made based on real-time device health rather than static credentials.

---

## 🚀 Project Overview

Traditional security models (VPNs, passwords, perimeter-based access) assume trust after login, which is ineffective in modern **WFH / hybrid cloud environments**.

This project solves that problem by implementing:
- Continuous device verification
- Risk-based trust scoring (0–100)
- Role-based Zero Trust enforcement
- Centralized audit logging

No user or device is trusted by default.

---

## 🎯 Real-Life Use Case

### Enterprise Remote Employee Access (WFH / Hybrid)

Employees and admins access:
- Internal dashboards  
- Git repositories  
- Cloud consoles (AWS / Azure / GCP)  

Access may originate from:
- Home networks
- Public Wi-Fi
- Personal or semi-managed devices

The system ensures that **only trusted and compliant devices** can access enterprise resources.

---

## 🧑‍💼 Roles Supported

### 👤 Employee
- Access to internal dashboards and development resources
- Lower trust threshold
- Personal scan history only

### 🛡️ Admin
- Access to production systems and cloud consoles
- Higher trust threshold
- Organization-wide visibility
- Stricter Zero Trust enforcement

Admins require higher trust due to increased security risk.

---

## 🧠 Zero Trust Principles Applied

- Never Trust, Always Verify  
- Device-based access validation  
- Least privilege access  
- Role-based enforcement  
- Continuous verification  
- Centralized monitoring and logging  

---

## 🏗️ System Architecture

**Architecture Style:** Microservices (Zero Trust)

User  
↓  
React Dashboard  
↓  
Node.js Gatekeeper API (PEP)  
↓  
Python Trust Engine (PDP)  
↓  
MongoDB (Audit Logs)  
↓  
Access Decision  

---

## 🖥️ Frontend (React.js)

### Features
- Role-based dashboards (Employee / Admin)
- Request secure access
- Trust score visualization
- Access decision display
- Scan history logs

---

## ⚙️ Backend (Node.js + Express)

### Responsibilities
- Acts as **Policy Enforcement Point (PEP)**
- Receives access requests
- Forwards device data to Trust Engine
- Enforces role-based Zero Trust decisions
- Stores logs in MongoDB

---

## 🧠 Trust Engine (Python)

### Responsibilities
- Acts as **Policy Decision Point (PDP)**
- Executes OSQuery device health checks
- Performs Nmap port scanning
- Calculates trust score (0–100)
- Applies role-based decision logic

---

## 📊 Trust Scoring Model

Firewall Enabled        : 25  
Antivirus Running       : 25  
OS Updated              : 20  
Safe Network Ports      : 20  
Recent Scan             : 10  
-----------------------------  
Total                   : 100  

---

## 🗄️ Database (MongoDB)

Collection: `trust_logs`

Stores:
- User ID
- Role
- Device ID
- Trust Score
- Decision
- Timestamp

---

## 🐳 DevOps & Deployment

- Docker & Docker Compose
- GitHub Actions CI/CD
- Microservice-based architecture

### Run Locally
```
docker-compose up
```

---

## 🧪 Demo Scenarios

- Secure employee device → Access Allowed  
- Same device as admin → MFA Required  
- Firewall disabled → Access Blocked  
- Antivirus stopped → Access Blocked  
- Outdated OS → Restricted Access  

---

## 🔮 Future Enhancements

- MFA integration
- Continuous trust re-evaluation
- AI-based anomaly detection
- Cloud IAM integration
- SIEM / SOAR integration

---

## 📌 Conclusion

This project demonstrates a **real-world implementation of Zero Trust Architecture** using modern fullstack technologies. It is suitable for academic submission, GitHub portfolios, and cybersecurity job interviews.

---

## 📄 License

Educational and demonstration use only.
