# 🛒 CampusMart

**Live Platform:** [thecampusmart.tech](https://thecampusmart.tech)

CampusMart is a dedicated, zero-trust marketplace built to remove the friction and safety concerns of public trading platforms. Designed exclusively for the Delhi Technological University (DTU) ecosystem, it ensures a highly secure, closed-loop trading environment by restricting access strictly to verified `@dtu.ac.in` email addresses. 

Whether exchanging textbooks between classes, sharing engineering notes, or selling technical gear across the campus hostels, CampusMart handles the verification so students can trade with absolute confidence.

## ✨ Core Features

*   **Zero-Trust Gatekeeping:** An automated security perimeter that instantly blocks non-student emails from registering, ensuring every user is a verified university peer.
*   **Passwordless OTP Authentication:** Seamless and secure login flows powered by the Resend API, eliminating password fatigue and database vulnerabilities.
*   **Exclusive Campus Economy:** A specialized marketplace UI designed specifically for university life—streamlining the process of buying, selling, and trading academic resources.
*   **Optimized Performance:** A lightweight, mobile-first frontend designed for fast browsing on the go, seamlessly communicating with a low-latency REST API.

## 🛠️ Tech Stack

**Frontend Architecture**
*   **Framework:** React.js
*   **Styling:** Tailwind CSS
*   **Deployment:** Vercel

**Backend Engine**
*   **Environment:** Node.js & Express.js
*   **Database:** MongoDB via Mongoose
*   **Authentication:** Resend API (Secure OTP)
*   **Deployment:** Render

## 🔒 Security Flow & Architecture

Unlike traditional public marketplaces, CampusMart prioritizes identity verification at the network edge:
1.  **Domain Verification:** The system strictly filters incoming registration requests against the official university domain regex.
2.  **OTP Dispatch:** Upon domain validation, a temporary, cryptographically secure one-time password is dynamically generated and dispatched via Resend.
3.  **Session Authorization:** Once verified, the user is granted a secure token and authenticated into the closed ecosystem, ready to post or browse listings.
