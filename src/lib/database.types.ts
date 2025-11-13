export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'citizen' | 'government' | 'partner'
          organization: string | null
          province: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'citizen' | 'government' | 'partner'
          organization?: string | null
          province?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'citizen' | 'government' | 'partner'
          organization?: string | null
          province?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          sector: string
          status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
          budget: number
          spent: number
          province: string
          city: string
          latitude: number | null
          longitude: number | null
          start_date: string
          end_date: string
          actual_end_date: string | null
          ministry: string
          responsible_person: string
          images: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          sector: string
          status?: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
          budget?: number
          spent?: number
          province: string
          city: string
          latitude?: number | null
          longitude?: number | null
          start_date: string
          end_date: string
          actual_end_date?: string | null
          ministry: string
          responsible_person: string
          images?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          sector?: string
          status?: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
          budget?: number
          spent?: number
          province?: string
          city?: string
          latitude?: number | null
          longitude?: number | null
          start_date?: string
          end_date?: string
          actual_end_date?: string | null
          ministry?: string
          responsible_person?: string
          images?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string | null
          title: string
          description: string
          category: 'delay' | 'quality' | 'corruption' | 'other'
          status: 'pending' | 'in_review' | 'resolved' | 'rejected'
          latitude: number | null
          longitude: number | null
          images: Json
          reporter_id: string
          assigned_to: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          description: string
          category: 'delay' | 'quality' | 'corruption' | 'other'
          status?: 'pending' | 'in_review' | 'resolved' | 'rejected'
          latitude?: number | null
          longitude?: number | null
          images?: Json
          reporter_id: string
          assigned_to?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          description?: string
          category?: 'delay' | 'quality' | 'corruption' | 'other'
          status?: 'pending' | 'in_review' | 'resolved' | 'rejected'
          latitude?: number | null
          longitude?: number | null
          images?: Json
          reporter_id?: string
          assigned_to?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          project_id: string
          type: 'budget_overrun' | 'delay' | 'milestone_missed'
          severity: 'low' | 'medium' | 'high' | 'critical'
          message: string
          is_read: boolean
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: 'budget_overrun' | 'delay' | 'milestone_missed'
          severity: 'low' | 'medium' | 'high' | 'critical'
          message: string
          is_read?: boolean
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          type?: 'budget_overrun' | 'delay' | 'milestone_missed'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          message?: string
          is_read?: boolean
          user_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string | null
          project_id: string | null
          content: string
          attachments: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id?: string | null
          project_id?: string | null
          content: string
          attachments?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string | null
          project_id?: string | null
          content?: string
          attachments?: Json
          is_read?: boolean
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          project_id: string | null
          start_time: string
          end_time: string
          location: string
          organizer_id: string
          participants: Json
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          project_id?: string | null
          start_time: string
          end_time: string
          location: string
          organizer_id: string
          participants?: Json
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          project_id?: string | null
          start_time?: string
          end_time?: string
          location?: string
          organizer_id?: string
          participants?: Json
          created_at?: string
        }
      }
    }
  }
}
