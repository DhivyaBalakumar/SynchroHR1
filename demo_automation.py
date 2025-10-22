import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains


class SynchroHRDemo:
    def __init__(self):
        options = Options()
        options.add_argument("--start-maximized")
        options.add_argument("--disable-notifications")
        options.add_argument("--disable-blink-features=AutomationControlled")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)
        self.base_url = "https://synchro-hr-fwc-git-main-dhivyas-projects-e2b392aa.vercel.app"

    def pause(self, msg, sec=1.0):
        print(f"⏸️  {msg}")
        time.sleep(sec)
    
    def check_404(self):
        """Check if current page is 404"""
        try:
            page_text = self.driver.page_source.lower()
            return "404" in page_text or "page not found" in page_text or "oops" in page_text
        except:
            return False
    
    def safe_navigate(self, url, description=""):
        """Navigate with 404 detection"""
        try:
            self.driver.get(url)
            time.sleep(1.5)
            if self.check_404():
                print(f"⚠️  Skipping {description} (404)")
                return False
            return True
        except:
            print(f"⚠️  Navigation failed for {description}")
            return False
    
    def smooth_scroll(self, pixels=800):
        """Smooth scroll with natural speed"""
        try:
            self.driver.execute_script(f"window.scrollBy({{top: {pixels}, behavior: 'smooth'}});")
            time.sleep(0.6)
        except:
            pass

    def sign_up_or_sign_in(self, role, name, email, password):
        """Handle sign up or sign in for a user role"""
        try:
            self.driver.get(f"{self.base_url}/auth?mode=signup&role={role}")
            time.sleep(2)

            try:
                name_field = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[id='fullName']")))
                name_field.clear()
                name_field.send_keys(name)
            except:
                pass
            
            email_field = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']")))
            email_field.clear()
            email_field.send_keys(email)
            
            password_field = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='password']")))
            password_field.clear()
            password_field.send_keys(password)

            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            time.sleep(2.5)

            if "already registered" in self.driver.page_source.lower():
                # Switch to login
                self.driver.get(f"{self.base_url}/auth?mode=login")
                time.sleep(2)
                email_field = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']")))
                email_field.clear()
                email_field.send_keys(email)
                password_field = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='password']")))
                password_field.clear()
                password_field.send_keys(password)
                submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                submit_btn.click()
                time.sleep(3)
        except Exception as e:
            print(f"⚠️  Authentication issue, continuing...")

    def explore_dashboard(self, role):
        """Explore personalized dashboard for each role"""
        try:
            if not self.safe_navigate(f"{self.base_url}/dashboard/{role}", f"{role} Dashboard"):
                return
            self.pause(f"📊 {role.upper()} Dashboard", 1.5)
            
            # Scroll through dashboard widgets
            for i in range(3):
                self.smooth_scroll(600)
            
            try:
                self.driver.execute_script("window.scrollTo({top: 0, behavior: 'smooth'});")
            except:
                pass
            self.pause("Dashboard Overview", 1)
        except:
            print(f"⚠️  Dashboard unavailable, continuing...")

    def explore_hr_features(self):
        """Explore HR-specific features: recruitment, screening, analytics"""
        print("\n🎯 Exploring HR Features...")
        
        # Resume Screening - AI-powered
        if self.safe_navigate(f"{self.base_url}/recruitment/screening", "AI Resume Screening"):
            self.pause("📄 AI Resume Screening", 1.5)
            self.smooth_scroll(800)
            self.smooth_scroll(800)
        
        # Enhanced Screening with AI evaluation
        if self.safe_navigate(f"{self.base_url}/recruitment/enhanced-screening", "Enhanced Screening"):
            self.pause("🤖 AI-Powered Candidate Evaluation", 1.5)
            self.smooth_scroll(800)
        
        # Interview Management - Voice & Conversation AI
        if self.safe_navigate(f"{self.base_url}/recruitment/interviews", "Interview Management"):
            self.pause("🎙️ AI Interview Management", 1.5)
            self.smooth_scroll(800)
            self.smooth_scroll(800)
        
        # Pipeline View
        if self.safe_navigate(f"{self.base_url}/recruitment/pipeline", "Recruitment Pipeline"):
            self.pause("📊 Recruitment Pipeline", 1.5)
            self.smooth_scroll(600)
        
        # Employee Management
        if self.safe_navigate(f"{self.base_url}/employees/list", "Employee Management"):
            self.pause("👥 Employee Data Management", 1.5)
            self.smooth_scroll(800)
        
        # Onboarding Management
        if self.safe_navigate(f"{self.base_url}/employees/onboarding", "Onboarding Management"):
            self.pause("🚀 Onboarding Workflows", 1.5)
            self.smooth_scroll(600)
        
        # Analytics Dashboard
        if self.safe_navigate(f"{self.base_url}/analytics/advanced", "Analytics Dashboard"):
            self.pause("📈 HR Analytics & Insights", 2)
            self.smooth_scroll(800)
            self.smooth_scroll(800)

    def explore_manager_features(self):
        """Explore Manager features: team, performance, projects"""
        print("\n👔 Exploring Manager Features...")
        
        # Performance Wall
        if self.safe_navigate(f"{self.base_url}/manager/performance-wall", "Performance Wall"):
            self.pause("⭐ Team Performance Tracking", 1.5)
            self.smooth_scroll(800)
        
        # Pulse Surveys
        if self.safe_navigate(f"{self.base_url}/manager/pulse-surveys", "Pulse Surveys"):
            self.pause("📊 Employee Pulse Surveys", 1.5)
            self.smooth_scroll(600)

    def explore_employee_features(self):
        """Explore Employee self-service features"""
        print("\n💼 Exploring Employee Features...")
        self.pause("Attendance, Leave, Performance Tracking", 1.5)
        # Dashboard already shows these widgets

    def explore_ai_features(self):
        """Showcase AI-powered features"""
        print("\n🤖 Exploring AI-Powered Features...")
        
        # AI Interview Demo
        if self.safe_navigate(f"{self.base_url}/demo/ai-interview", "AI Interview Demo"):
            self.pause("🎙️ AI Voice Interview System", 2)
            self.smooth_scroll(800)
        
        # Career Coach AI
        if self.safe_navigate(f"{self.base_url}/career/coach", "Career Coach"):
            self.pause("💬 AI Career Coach", 1.5)
            self.smooth_scroll(600)

    def explore_public_features(self):
        """Explore public job portal"""
        print("\n🌐 Exploring Public Job Portal...")
        
        if self.safe_navigate(f"{self.base_url}/jobs", "Job Listings"):
            self.pause("📢 Job Listings Portal", 1.5)
            self.smooth_scroll(800)
            self.smooth_scroll(800)
            
            # Job Application
            try:
                first_job = self.driver.find_element(By.CSS_SELECTOR, "a[href*='/jobs/']")
                first_job.click()
                time.sleep(1.5)
                if not self.check_404():
                    self.pause("📝 Job Application Form", 1.5)
                    self.smooth_scroll(600)
            except:
                pass

    def demo(self):
        """Comprehensive demo showcasing all HRMS features"""
        print("\n" + "="*60)
        print("🚀 Starting Synchro HR - AI-Powered HRMS Demo")
        print("="*60 + "\n")
        
        # Landing page
        self.driver.get(self.base_url)
        self.pause("🏠 Landing Page - AI-Powered HR Management", 2)
        self.smooth_scroll(800)
        self.smooth_scroll(800)
        self.driver.execute_script("window.scrollTo({top: 0, behavior: 'smooth'});")
        
        # Public features first (no login needed)
        self.explore_public_features()
        self.explore_ai_features()
        
        # Multi-role authentication and personalized dashboards
        print("\n" + "="*60)
        print("👥 Multi-Role System Demo")
        print("="*60)
        
        users = {
            'admin': ('Admin User', 'admin@synchro.app', 'Admin2024!'),
            'senior_manager': ('Senior Manager', 'senior.manager@synchro.app', 'SeniorMgr2024!'),
            'hr': ('Sarah HR', 'sarah.hr@synchro.app', 'HRManager2024!'),
            'manager': ('John Manager', 'john.manager@synchro.app', 'Manager2024!'),
            'employee': ('Mike Employee', 'mike.employee@synchro.app', 'Employee2024!'),
            'intern': ('Alex Intern', 'alex.intern@synchro.app', 'Intern2024!')
        }
        
        # Admin Dashboard
        print("\n🔑 ADMIN ROLE - Company-wide + Individual Dashboards")
        name, email, pwd = users['admin']
        self.sign_up_or_sign_in('admin', name, email, pwd)
        self.explore_dashboard('admin')
        self.pause("Sign out", 0.5)
        self.driver.get(f"{self.base_url}/auth?mode=login")
        
        # HR Role - Core HRMS features
        print("\n👔 HR ROLE - Recruitment, Screening & Employee Management")
        name, email, pwd = users['hr']
        self.sign_up_or_sign_in('hr', name, email, pwd)
        self.explore_dashboard('hr')
        self.explore_hr_features()
        self.pause("Sign out", 0.5)
        self.driver.get(f"{self.base_url}/auth?mode=login")
        
        # Senior Manager Role
        print("\n👨‍💼 SENIOR MANAGER ROLE")
        name, email, pwd = users['senior_manager']
        self.sign_up_or_sign_in('senior_manager', name, email, pwd)
        self.explore_dashboard('senior_manager')
        self.pause("Sign out", 0.5)
        self.driver.get(f"{self.base_url}/auth?mode=login")
        
        # Manager Role
        print("\n👔 MANAGER ROLE - Team Management & Performance")
        name, email, pwd = users['manager']
        self.sign_up_or_sign_in('manager', name, email, pwd)
        self.explore_dashboard('manager')
        self.explore_manager_features()
        self.pause("Sign out", 0.5)
        self.driver.get(f"{self.base_url}/auth?mode=login")
        
        # Employee Role
        print("\n💼 EMPLOYEE ROLE - Self-Service Portal")
        name, email, pwd = users['employee']
        self.sign_up_or_sign_in('employee', name, email, pwd)
        self.explore_dashboard('employee')
        self.explore_employee_features()
        self.pause("Sign out", 0.5)
        self.driver.get(f"{self.base_url}/auth?mode=login")
        
        # Intern Role
        print("\n🎓 INTERN ROLE - Learning & Development")
        name, email, pwd = users['intern']
        self.sign_up_or_sign_in('intern', name, email, pwd)
        self.explore_dashboard('intern')
        
        print("\n" + "="*60)
        print("✅ Demo Complete - All Features Showcased")
        print("="*60 + "\n")
        
        self.cleanup()

    def cleanup(self):
        self.pause("Cleaning up...", 2)
        self.driver.quit()
        print("Demo completed!")


def main():
    demo = SynchroHRDemo()
    demo.demo()


if __name__ == "__main__":
    main()
