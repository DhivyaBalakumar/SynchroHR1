# SynchroHR – Intelligent HR Management System


SynchroHR is an **AI‑powered Human Resource Management System** designed for modern organizations to automate recruitment, conduct AI‑driven video interviews, perform sentiment and emotion analysis, optimize workforce analytics in real time, and manage seamless onboarding and multi-user role-based access.

---

## 🚀 Features


### 🔐 Authentication & Access Control
- Secure multi-role login (Management Admin, HR, Manager, Employee, Intern, Senior Manager)
- Email/password with RBAC
- Fine-grained Row Level Security via Supabase
- Protected client-side & server routes per role

### 👥 User Roles & Dashboards
- Six core roles, each with tailored dashboards, navigation, and permissions
    - **Management/Admin:** Full control, analytics, user provisioning
    - **HR Recruiter:** Candidate tracking, compliance, interview management
    - **Manager/Senior Manager:** Team analytics, goal setting, reviews
    - **Employee:** Self-service workspace, leave, performance, growth
    - **Intern:** Onboarding, learning modules, progress tracking

### 🤖 AI Automation
- **AI Resume Screening:** Bulk CV parsing, ATS scoring with customizable criteria
- **AI Voice Interviews:** Real-time AI Q&A with sentiment/emotion analysis
- **AI Interview Analysis:** Multimodal review (audio/video/text), auto-reports
- **AI Career Coach:** Personalized guidance using Lovable AI
- **Predictive Analytics:** Attrition prediction, team performance, recommendations

### 📊 Recruitment & Hiring
- Job boards, applications portal, resume parsing
- Candidate pipeline visualization
- Interview scheduling, token generation, bulk upload
- Automated email invitations, selection/rejection notifications

### 👔 Employee Management
- Employee profile system with skills, history, department data
- Admin, HR, and Manager UI for role/department management
- Skill tracking, search, and organization-wide filtering

### 🎯 Onboarding Automation
- Workflow generator for new hires
- Task assignment tracking (HR, managers, employees)
- Equipment/training/document setup tracking
- Dedicated onboarding dashboards

### 📈 Performance Management
- Review system: periodic and on-demand feedback
- Performance wall for ranking and recognition
- Goal setting, pulse surveys, badge/award modules

### ⏰ Attendance & Time
- Attendance tracking, leave request workflows
- Approval/rejection tracking, leave analytics
- Team-wise time logging integration

### 💰 Payroll & Compensation
- Salary data access per role, payslip download
- Manager dashboard for salary insights and budgeting

### 📧 Email Automation
- Email queue integration for event-triggered mail
- Automated delivery for recruitment, onboarding, selection/rejection, password reset, verification workflows

### 📊 Advanced Analytics & Reporting
- Real-time dashboards for team performance, recruitment, department health
- Predictive analytics (attrition, growth)
- KPI builder and automated report generator

### 🎓 Learning & Development
- Employee upskilling learning paths
- Mentorship assignments and tracking
- Career growth roadmap and training modules

### 🔧 System Features
- Demo mode toggle with simulated data
- Error boundary logging, real-time update notifications
- Responsive design, dark/light modes
- Floating AI chatbot assistant

### 📁 Data Management
- Bulk data upload, seed data generator for testing/demo
- Export and analytics filtering (demo vs. real data)

---

## 🧠 Tech Stack


| Layer           | Technology                        |
|-----------------|-----------------------------------|
| Frontend        | React + TypeScript + Vite         |
| Styling         | Tailwind CSS + shadcn/ui          |
| Backend         | Supabase (Auth, DB, Edge Functions)|
| AI Layer        | OpenAI-compatible                 |
| Video           | WebRTC / Video APIs for interviews |
| Email           | Resend API                        |
| Hosting         | Vercel                            |

### Key Frontend Libraries
- React 18.3 + TypeScript
- Vite (build/dev)
- Tailwind CSS
- Shadcn UI
- Framer Motion (animations)
- React Router DOM (routing)
- TanStack React Query (data fetching)
- Lucide React (icons)
- Recharts (charts/graphs)
- React Hook Form + Zod (form validation)

### Backend & Infrastructure
- Supabase cloud (PostgreSQL DB, Auth, RLS, Edge Functions, Storage buckets)
- Real-time data subscriptions

### APIs & Integrations
- Lovable AI API for conversations, analytics, career features
- Resend API (email automation)
- OpenAI API (optional, advanced AI features)

---

## 🔗 Integration Points

| Service                 | Why & How Used                                        |
|-------------------------|-------------------------------------------------------|
| Supabase Database       | Core data, RBAC, edge functions, auth                 |
| Supabase Storage        | Files, resumes, docs                                  |
| Supabase Edge Functions | Custom backend and event hooks                        |
| Resend API              | Automated mail for recruitment & onboarding           |
| Lovable AI Gateway      | All AI-driven, analytics, recommendations             |

---

## 🗄️ Database Schema

| Table Name                    | Purpose                                        |
|-------------------------------|------------------------------------------------|
| profiles, user_roles          | Users, authentication, access control          |
| employees, departments        | Employee records, department structure         |
| jobs, job_applications        | Recruitment process, candidate tracking        |
| resumes, interview_tokens     | Document uploads, interview security/tokens    |
| interviews, interview_reports | AI-driven interview stages/outcomes            |
| performance_reviews, pulse_surveys | Feedback, recognition, analytics      |
| onboarding_workflows, onboarding_tasks | HR onboarding modules              |
| career_goals, mentorship      | Employee growth/learning modules               |
| email_queue, error_logs       | System automation, notification, monitoring    |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

VITE_SUPABASE_URL=https://wapydsvgltbhkvbfaybp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
(Use VITE_ prefixes for client‑side variables)
text

---

## 🧩 Setup & Run Locally


git clone https://github.com/DhivyaBalakumar/SynchroHR1.git
cd SynchroHR1
npm install
npm run dev

Visit [http://localhost:5173/](http://localhost:5173/).

---

## 🏁 Deployment


Deployed with **Vercel**, the project is accessible at:  
[synchro-hr-fwc-git-main-dhivyas-projects-e2b392aa.vercel.app](https://synchro-hr-fwc-git-main-dhivyas-projects-e2b392aa.vercel.app)



**Steps:**
1. Set environment variables in Vercel.
2. Push to `main` – triggers auto-deploy.
3. Verify routing and API integrations.

---

## 💡 Future Enhancements
[Ideas](https://github.com/DhivyaBalakumar/SynchroHRMS/blob/main/README.md#-future-enhancements)
- Advanced organizational HR analytics
- Enhanced role‑specific dashboards and OKR tracking

---

## 👩‍💻 Hackathon Summary
[Summary](https://github.com/DhivyaBalakumar/SynchroHRMS/blob/main/README.md#%E2%80%8D-hackathon-summary)

- **Goal:** End-to-end AI-driven HRMS: resume screening, video interviews (emotion analysis), multi-role RBAC, onboarding, predictive analytics.
- **Core Differentiator:** AI interviewing, seamless recruitment-to-onboarding.

---

## 🛡️ Security & Scalability
All features built for production with enterprise-grade security (Supabase RLS, RBAC, encrypted storage, secure email, audited edge logic). Horizontal scalability for organizations of any size.
- RBAC, Row-Level Security, encrypted file storage, secure mail, audited edge logic.

---

## 📚 Documentation
For API usage and advanced setups, see the `/docs` directory in this repo.

---

## 🏆 Author
[Contact](https://github.com/DhivyaBalakumar/SynchroHRMS/blob/main/README.md#-author)

**Dhivya Balakumar**  
Creator & Developer – SynchroHR  
Contact: [dhivyabalakumar28@gmail.com](mailto:dhivyabalakumar28@gmail)
