# SynchroHR – Intelligent HR Management System

SynchroHR is an **AI‑powered Human Resource Management System** designed for modern organizations to automate recruitment, conduct AI‑driven video interviews, perform sentiment and emotion analysis, optimize workforce analytics in real time, and manage seamless onboarding and multi-user role-based access.

---

## 🚀 Features

### Recruitment & Screening
- **Bulk Resume Screening** – Upload and parse multiple resumes at once with AI‑powered skill extraction and ranking.
- **AI Resume Parsing** – Evaluate candidates on skills, experience, and cultural fit.
- **Job Matching Algorithm** – AI‑based ranking using skill weighting.

### AI Interview System
- One‑click **video interviews** with real‑time emotion and facial expression analysis.
- **Natural‑language question generation** for customized interview experience.
- **Interview Summary Reports** – Emotion analysis and candidate evaluation.

### Onboarding & Employee Management
- Streamlined candidate-to-employee onboarding workflows.
- Automated document collection and compliance verification.
- Employee profiles, attendance, and role management.

### Data Analysis & Dashboards
- Real-time **HR analytics** on hiring, retention, performance, and diversity.
- Predictive modeling for attrition and employee growth.
- Customizable dashboards with role‑based insights.

### Multi-User Login & Role Management
- Secure authentication and authorization using Supabase Auth.
- Role‑based access control for HR, managers, employees, interns, and admins.
- Activity logs and audit trails.

### Email & Notification System
- Automated emails for application updates, interview scheduling, onboarding, and feedback.
- Integration with Resend API using your verified sender address.

---

## 🧠 Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React + TypeScript + Vite                       |
| Styling     | Tailwind CSS + shadcn/ui                        |
| Backend     | Supabase (Auth, DB, Edge Functions)             |
| AI Layer    | OpenAI-compatible endpoints for parsing & analysis |
| Video       | WebRTC / Video APIs for interviews               |
| Email       | Resend API                                      |
| Hosting     | Vercel                                          |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

Supabase
VITE_SUPABASE_URL=https://wapydsvgltbhkvbfaybp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-public-key>

Email + Auth
RESEND_API_KEY=<your-resend-key>



(Use `VITE_` prefixes for client‑side variables.)

---

## 🧩 Setup & Run Locally
git clone https://github.com/DhivyaBalakumar/SynchroHR.git
cd SynchroHR
npm install
npm run dev

Visit [[**http://localhost:5173/**](http://localhost:5173/)](http://localhost:5173/).

---

## 🏁 Deployment

Deployed with **Vercel**  
Custom domain: synchro-hr-fwc.vercel.app 

Steps:
1. Set environment variables in Vercel.
2. Push to `main` – triggers auto deploy.
3. Verify routing and API integrations.

---

## 💡 Future Enhancements
- Advanced organizational HR analytics  
- Enhanced role‑specific dashboards and OKR tracking  

---

## 👩‍💻 Hackathon Summary

**Goal:** Build an end-to-end AI-driven HRMS with bulk resume screening, AI video interviews with emotion analysis, multi-user role-based access, onboarding automation, and predictive HR analytics.

**Core Differentiator:** AI interviewing combined with seamless recruitment-to-onboarding automation.

---

## 🏆 Author

**Dhivya Balakumar**  
Creator & Developer – SynchroHR  
Contact: [dhivyabalakumar28@gmail.com](mailto:dhivyabalakumar28@gmail.com)
