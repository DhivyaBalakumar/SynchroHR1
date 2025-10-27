export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          sign_in_time: string | null
          sign_out_time: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          sign_in_time?: string | null
          sign_out_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          sign_in_time?: string | null
          sign_out_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_type: string
          id: string
          process_name: string
          resolved: boolean
          stack_trace: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          process_name: string
          resolved?: boolean
          stack_trace?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          process_name?: string
          resolved?: boolean
          stack_trace?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          resume_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          resume_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          resume_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      career_coaching_sessions: {
        Row: {
          ai_recommendations: Json | null
          created_at: string | null
          id: string
          progress_data: Json | null
          session_type: string
          updated_at: string | null
          user_goals: Json | null
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          session_type: string
          updated_at?: string | null
          user_goals?: Json | null
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          session_type?: string
          updated_at?: string | null
          user_goals?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string
          email_data: Json | null
          email_type: string | null
          error_message: string | null
          id: string
          resume_id: string | null
          retry_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
        }
        Insert: {
          created_at?: string
          email_data?: Json | null
          email_type?: string | null
          error_message?: string | null
          id?: string
          resume_id?: string | null
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
        }
        Update: {
          created_at?: string
          email_data?: Json | null
          email_type?: string | null
          error_message?: string | null
          id?: string
          resume_id?: string | null
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          proficiency_level: number | null
          skill_id: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          proficiency_level?: number | null
          skill_id: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          proficiency_level?: number | null
          skill_id?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          employee_id: string
          employee_sentiment: Json | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          full_name: string
          hire_date: string
          id: string
          manager_id: string | null
          performance_metrics: Json | null
          phone: string | null
          position: string
          salary_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          employee_id: string
          employee_sentiment?: Json | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name: string
          hire_date: string
          id?: string
          manager_id?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          position: string
          salary_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          employee_id?: string
          employee_sentiment?: Json | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          full_name?: string
          hire_date?: string
          id?: string
          manager_id?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          position?: string
          salary_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_analysis: {
        Row: {
          ai_summary: string | null
          analysis_completed_at: string | null
          areas_of_improvement: string[] | null
          audio_transcript: string | null
          body_language_notes: string | null
          communication_score: number | null
          confidence_score: number | null
          created_at: string | null
          detected_emotions: Json | null
          dominant_emotion: string | null
          emotion_timeline: Json | null
          engagement_score: number | null
          facial_expressions: Json | null
          filler_words_count: number | null
          id: string
          interview_id: string
          key_insights: string[] | null
          overall_rating: number | null
          overall_sentiment: string | null
          pause_analysis: Json | null
          professionalism_score: number | null
          sentiment_details: Json | null
          sentiment_score: number | null
          speech_clarity: number | null
          speech_pace: number | null
          strengths: string[] | null
          transcript_confidence: number | null
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          analysis_completed_at?: string | null
          areas_of_improvement?: string[] | null
          audio_transcript?: string | null
          body_language_notes?: string | null
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_emotions?: Json | null
          dominant_emotion?: string | null
          emotion_timeline?: Json | null
          engagement_score?: number | null
          facial_expressions?: Json | null
          filler_words_count?: number | null
          id?: string
          interview_id: string
          key_insights?: string[] | null
          overall_rating?: number | null
          overall_sentiment?: string | null
          pause_analysis?: Json | null
          professionalism_score?: number | null
          sentiment_details?: Json | null
          sentiment_score?: number | null
          speech_clarity?: number | null
          speech_pace?: number | null
          strengths?: string[] | null
          transcript_confidence?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          analysis_completed_at?: string | null
          areas_of_improvement?: string[] | null
          audio_transcript?: string | null
          body_language_notes?: string | null
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_emotions?: Json | null
          dominant_emotion?: string | null
          emotion_timeline?: Json | null
          engagement_score?: number | null
          facial_expressions?: Json | null
          filler_words_count?: number | null
          id?: string
          interview_id?: string
          key_insights?: string[] | null
          overall_rating?: number | null
          overall_sentiment?: string | null
          pause_analysis?: Json | null
          professionalism_score?: number | null
          sentiment_details?: Json | null
          sentiment_score?: number | null
          speech_clarity?: number | null
          speech_pace?: number | null
          strengths?: string[] | null
          transcript_confidence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_analysis_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          comments: string | null
          communication_score: number | null
          created_at: string
          cultural_fit_score: number | null
          id: string
          interview_id: string
          interviewer_id: string | null
          overall_rating: number | null
          recommendation: string | null
          strengths: string | null
          technical_score: number | null
          weaknesses: string | null
        }
        Insert: {
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          id?: string
          interview_id: string
          interviewer_id?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          technical_score?: number | null
          weaknesses?: string | null
        }
        Update: {
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          cultural_fit_score?: number | null
          id?: string
          interview_id?: string
          interviewer_id?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          technical_score?: number | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          interview_completed: boolean | null
          resume_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          interview_completed?: boolean | null
          resume_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          interview_completed?: boolean | null
          resume_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_tokens_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          ai_evaluation: Json | null
          ai_score: number | null
          ai_summary: string | null
          audio_url: string | null
          candidate_email: string
          candidate_name: string
          combined_url: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          feedback: Json | null
          id: string
          interview_link: string | null
          interview_type: string | null
          meeting_link: string | null
          overall_score: number | null
          position: string
          recording_url: string | null
          resume_id: string | null
          scheduled_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["interview_status"]
          transcript: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          ai_evaluation?: Json | null
          ai_score?: number | null
          ai_summary?: string | null
          audio_url?: string | null
          candidate_email: string
          candidate_name: string
          combined_url?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          interview_link?: string | null
          interview_type?: string | null
          meeting_link?: string | null
          overall_score?: number | null
          position: string
          recording_url?: string | null
          resume_id?: string | null
          scheduled_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          transcript?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          ai_evaluation?: Json | null
          ai_score?: number | null
          ai_summary?: string | null
          audio_url?: string | null
          candidate_email?: string
          candidate_name?: string
          combined_url?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          interview_link?: string | null
          interview_type?: string | null
          meeting_link?: string | null
          overall_score?: number | null
          position?: string
          recording_url?: string | null
          resume_id?: string | null
          scheduled_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          transcript?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          job_role_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          job_role_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          job_role_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          requirements: Json | null
          status: string
          title: string
          updated_at: string
          urgency: string | null
          vacancies: number | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string | null
          vacancies?: number | null
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          requirements?: Json | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string | null
          vacancies?: number | null
        }
        Relationships: []
      }
      leave_balance: {
        Row: {
          annual_leave: number
          casual_leave: number
          created_at: string
          employee_id: string
          id: string
          sick_leave: number
          updated_at: string
        }
        Insert: {
          annual_leave?: number
          casual_leave?: number
          created_at?: string
          employee_id: string
          id?: string
          sick_leave?: number
          updated_at?: string
        }
        Update: {
          annual_leave?: number
          casual_leave?: number
          created_at?: string
          employee_id?: string
          id?: string
          sick_leave?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_insights: {
        Row: {
          created_at: string
          description: string | null
          id: string
          insight_type: string
          is_actioned: boolean
          is_read: boolean
          manager_id: string
          priority: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          insight_type: string
          is_actioned?: boolean
          is_read?: boolean
          manager_id: string
          priority?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          insight_type?: string
          is_actioned?: boolean
          is_read?: boolean
          manager_id?: string
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_insights_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          document_name: string
          document_type: string
          file_url: string | null
          id: string
          status: string
          task_id: string | null
          uploaded_at: string | null
          workflow_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_name: string
          document_type: string
          file_url?: string | null
          id?: string
          status?: string
          task_id?: string | null
          uploaded_at?: string | null
          workflow_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_name?: string
          document_type?: string
          file_url?: string | null
          id?: string
          status?: string
          task_id?: string | null
          uploaded_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_documents_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_to: string | null
          auto_trigger_days: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          assigned_to?: string | null
          auto_trigger_days?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          priority?: string
          status?: string
          task_type: string
          title: string
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          assigned_to?: string | null
          auto_trigger_days?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_workflows: {
        Row: {
          completed_at: string | null
          created_at: string | null
          employee_id: string
          id: string
          progress_percentage: number
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_workflows_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_rankings: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          last_updated_at: string | null
          manager_id: string
          notes: string | null
          rank_position: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          last_updated_at?: string | null
          manager_id: string
          notes?: string | null
          rank_position: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          last_updated_at?: string | null
          manager_id?: string
          notes?: string | null
          rank_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_rankings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string | null
          resume_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
          resume_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
          resume_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_audit_logs_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_questions: {
        Row: {
          created_at: string | null
          id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_responses: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          respondent_id: string
          response_value: Json
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          respondent_id: string
          response_value: Json
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          respondent_id?: string
          response_value?: Json
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "pulse_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_surveys: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          target_audience: string
          target_ids: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          target_audience: string
          target_ids?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          target_audience?: string
          target_ids?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          candidate_name: string
          created_at: string
          email: string
          file_url: string | null
          id: string
          interview_completed_email_sent: boolean | null
          interview_scheduled_at: string | null
          interview_scheduled_email_sent: boolean | null
          job_role_id: string | null
          parsed_data: Json | null
          phone: string | null
          pipeline_stage: string | null
          position_applied: string
          screening_status: Database["public"]["Enums"]["screening_status"]
          selection_email_sent: boolean | null
          source: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_name: string
          created_at?: string
          email: string
          file_url?: string | null
          id?: string
          interview_completed_email_sent?: boolean | null
          interview_scheduled_at?: string | null
          interview_scheduled_email_sent?: boolean | null
          job_role_id?: string | null
          parsed_data?: Json | null
          phone?: string | null
          pipeline_stage?: string | null
          position_applied: string
          screening_status?: Database["public"]["Enums"]["screening_status"]
          selection_email_sent?: boolean | null
          source?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_name?: string
          created_at?: string
          email?: string
          file_url?: string | null
          id?: string
          interview_completed_email_sent?: boolean | null
          interview_scheduled_at?: string | null
          interview_scheduled_email_sent?: boolean | null
          job_role_id?: string | null
          parsed_data?: Json | null
          phone?: string | null
          pipeline_stage?: string | null
          position_applied?: string
          screening_status?: Database["public"]["Enums"]["screening_status"]
          selection_email_sent?: boolean | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_records: {
        Row: {
          allowances: number | null
          base_salary: number
          created_at: string
          deductions: number | null
          effective_date: string
          employee_id: string
          id: string
          increment_amount: number | null
          net_salary: number
          payment_date: string | null
        }
        Insert: {
          allowances?: number | null
          base_salary: number
          created_at?: string
          deductions?: number | null
          effective_date: string
          employee_id: string
          id?: string
          increment_amount?: number | null
          net_salary: number
          payment_date?: string | null
        }
        Update: {
          allowances?: number | null
          base_salary?: number
          created_at?: string
          deductions?: number | null
          effective_date?: string
          employee_id?: string
          id?: string
          increment_amount?: number | null
          net_salary?: number
          payment_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          ai_feedback: string | null
          assessment_date: string | null
          created_at: string | null
          current_level: number
          id: string
          skill_name: string
          target_level: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          assessment_date?: string | null
          created_at?: string | null
          current_level: number
          id?: string
          skill_name: string
          target_level?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          assessment_date?: string | null
          created_at?: string | null
          current_level?: number
          id?: string
          skill_name?: string
          target_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          manager_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          manager_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      seed_sample_onboarding: { Args: never; Returns: undefined }
      validate_interview_token: {
        Args: { _token: string }
        Returns: {
          is_valid: boolean
          resume_id: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "hr"
        | "manager"
        | "senior_manager"
        | "employee"
        | "intern"
      email_status: "pending" | "sent" | "failed"
      employment_status: "active" | "on_leave" | "terminated" | "probation"
      interview_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      screening_status: "pending" | "selected" | "rejected"
      task_status: "todo" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "hr",
        "manager",
        "senior_manager",
        "employee",
        "intern",
      ],
      email_status: ["pending", "sent", "failed"],
      employment_status: ["active", "on_leave", "terminated", "probation"],
      interview_status: ["scheduled", "in_progress", "completed", "cancelled"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      screening_status: ["pending", "selected", "rejected"],
      task_status: ["todo", "in_progress", "completed", "cancelled"],
    },
  },
} as const
