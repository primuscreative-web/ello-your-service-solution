export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AppRole = "client" | "professional" | "admin";
type VerificationStatus = "draft" | "pending" | "verified" | "rejected";
type QuoteStatus =
  | "new"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "declined";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
type PaymentMode = "external" | "platform";
type PaymentStatus =
  | "not_applicable"
  | "pending"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed"
  | "disputed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: AppRole;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: AppRole;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          role?: AppRole;
          full_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      client_profiles: {
        Row: {
          id: string;
          user_id: string;
          birth_date: string | null;
          city: string;
          region: string | null;
          interests: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          birth_date?: string | null;
          city: string;
          region?: string | null;
          interests?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_profiles"]["Insert"]>;
      };
      professional_profiles: {
        Row: {
          id: string;
          user_id: string;
          public_name: string | null;
          specialty: string;
          city: string;
          coverage: string;
          description: string;
          base_price: string;
          charge_type: string;
          availability: string | null;
          materials: string | null;
          phone: string | null;
          fiscal_city: string | null;
          document_ref: string | null;
          verification_status: VerificationStatus;
          profile_status: string;
          avatar_url: string | null;
          banner_url: string | null;
          created_at: string;
          updated_at: string;
          headline: string | null;
          bio: string | null;
          experience_years: number;
          trust_level: string;
          rating: number;
          completed_jobs: number;
          response_time_minutes: number | null;
          is_published: boolean;
          ello_link_slug: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          public_name?: string | null;
          specialty: string;
          city: string;
          coverage: string;
          description: string;
          base_price: string;
          charge_type: string;
          availability?: string | null;
          materials?: string | null;
          phone?: string | null;
          fiscal_city?: string | null;
          document_ref?: string | null;
          verification_status?: VerificationStatus;
          profile_status?: string;
          avatar_url?: string | null;
          banner_url?: string | null;
          created_at?: string;
          updated_at?: string;
          headline?: string | null;
          bio?: string | null;
          experience_years?: number;
          trust_level?: string;
          rating?: number;
          completed_jobs?: number;
          response_time_minutes?: number | null;
          is_published?: boolean;
          ello_link_slug?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["professional_profiles"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          professional_id: string;
          title: string;
          description: string | null;
          category: string;
          base_price: string | null;
          charge_type: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          title: string;
          description?: string | null;
          category: string;
          base_price?: string | null;
          charge_type?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      portfolio_items: {
        Row: {
          id: string;
          professional_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
          media_url: string | null;
          media_kind: string;
          is_featured: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          professional_id: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          media_url?: string | null;
          media_kind?: string;
          is_featured?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["portfolio_items"]["Insert"]>;
      };
      quote_requests: {
        Row: {
          id: string;
          client_id: string;
          professional_id: string;
          service_id: string | null;
          description: string;
          desired_date: string | null;
          location: string;
          status: QuoteStatus;
          response_price: string | null;
          response_eta: string | null;
          response_message: string | null;
          responded_at: string | null;
          accepted_at: string | null;
          cancelled_at: string | null;
          payment_mode: PaymentMode;
          payment_status: PaymentStatus;
          platform_fee_percent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          professional_id: string;
          service_id?: string | null;
          description: string;
          desired_date?: string | null;
          location: string;
          status?: QuoteStatus;
          response_price?: string | null;
          response_eta?: string | null;
          response_message?: string | null;
          responded_at?: string | null;
          accepted_at?: string | null;
          cancelled_at?: string | null;
          payment_mode?: PaymentMode;
          payment_status?: PaymentStatus;
          platform_fee_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_requests"]["Insert"]>;
      };
      quote_messages: {
        Row: {
          id: string;
          quote_request_id: string;
          sender_user_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          quote_request_id: string;
          sender_user_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quote_messages"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          quote_request_id: string | null;
          client_id: string;
          professional_id: string;
          service_id: string | null;
          starts_at: string;
          ends_at: string | null;
          status: AppointmentStatus;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_request_id?: string | null;
          client_id: string;
          professional_id: string;
          service_id?: string | null;
          starts_at: string;
          ends_at?: string | null;
          status?: AppointmentStatus;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      favorites: {
        Row: {
          client_id: string;
          professional_id: string;
          created_at: string;
        };
        Insert: {
          client_id: string;
          professional_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          quote_request_id: string;
          client_id: string;
          professional_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_request_id: string;
          client_id: string;
          professional_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      verification_status: VerificationStatus;
      quote_status: QuoteStatus;
      appointment_status: AppointmentStatus;
      message_kind: "text" | "image" | "file" | "quote" | "appointment";
    };
    CompositeTypes: Record<string, never>;
  };
};
