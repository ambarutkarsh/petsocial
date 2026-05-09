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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_estimates: {
        Row: {
          breed: string | null
          budget_tier: string | null
          city: string | null
          created_at: string | null
          details_json: Json | null
          food_monthly: number | null
          grooming_monthly: number | null
          health_monthly: number | null
          id: string
          ownership_monthly: number | null
          pet_id: string | null
          pet_type: string | null
          total_annual: number | null
          total_monthly: number | null
          user_id: string | null
        }
        Insert: {
          breed?: string | null
          budget_tier?: string | null
          city?: string | null
          created_at?: string | null
          details_json?: Json | null
          food_monthly?: number | null
          grooming_monthly?: number | null
          health_monthly?: number | null
          id?: string
          ownership_monthly?: number | null
          pet_id?: string | null
          pet_type?: string | null
          total_annual?: number | null
          total_monthly?: number | null
          user_id?: string | null
        }
        Update: {
          breed?: string | null
          budget_tier?: string | null
          city?: string | null
          created_at?: string | null
          details_json?: Json | null
          food_monthly?: number | null
          grooming_monthly?: number | null
          health_monthly?: number | null
          id?: string
          ownership_monthly?: number | null
          pet_id?: string | null
          pet_type?: string | null
          total_annual?: number | null
          total_monthly?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_estimates_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_estimates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_estimates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_contact_requests: {
        Row: {
          chip_number: string
          created_at: string
          id: string
          message: string | null
          requester_id: string
          status: string
        }
        Insert: {
          chip_number: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          status?: string
        }
        Update: {
          chip_number?: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chip_contact_requests_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chip_contact_requests_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_entries: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_entries_comp_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_entries_post_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_entries_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_entries_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          prize: string | null
          rules: string | null
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          prize?: string | null
          rules?: string | null
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          prize?: string | null
          rules?: string | null
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "pet_club_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          created_at: string | null
          food_name: string | null
          id: string
          log_date: string | null
          meal_type: string | null
          notes: string | null
          owner_id: string | null
          pet_id: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          food_name?: string | null
          id?: string
          log_date?: string | null
          meal_type?: string | null
          notes?: string | null
          owner_id?: string | null
          pet_id?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          food_name?: string | null
          id?: string
          log_date?: string | null
          meal_type?: string | null
          notes?: string | null
          owner_id?: string | null
          pet_id?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_accepted_answer: boolean | null
          parent_reply_id: string | null
          topic_id: string
          upvote_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_accepted_answer?: boolean | null
          parent_reply_id?: string | null
          topic_id: string
          upvote_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_accepted_answer?: boolean | null
          parent_reply_id?: string | null
          topic_id?: string
          upvote_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_solved: boolean | null
          is_urgent: boolean | null
          pet_category: string | null
          pet_id: string | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upvote_count: number | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_solved?: boolean | null
          is_urgent?: boolean | null
          pet_category?: string | null
          pet_id?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvote_count?: number | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_solved?: boolean | null
          is_urgent?: boolean | null
          pet_category?: string | null
          pet_id?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvote_count?: number | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string | null
          id: string
          reply_id: string | null
          topic_id: string | null
          user_id: string
          vote_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_id?: string | null
          topic_id?: string | null
          user_id: string
          vote_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_id?: string | null
          topic_id?: string | null
          user_id?: string
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          created_at: string | null
          food_ml: number | null
          id: string
          log_date: string | null
          notes: string | null
          owner_id: string
          pet_id: string
          steps: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          food_ml?: number | null
          id?: string
          log_date?: string | null
          notes?: string | null
          owner_id: string
          pet_id: string
          steps?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          food_ml?: number | null
          id?: string
          log_date?: string | null
          notes?: string | null
          owner_id?: string
          pet_id?: string
          steps?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      home_carousel_config: {
        Row: {
          created_at: string
          created_by: string | null
          custom_banners: Json
          id: string
          is_active: boolean
          selected_item_ids: string[]
          source_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_banners?: Json
          id?: string
          is_active?: boolean
          selected_item_ids?: string[]
          source_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_banners?: Json
          id?: string
          is_active?: boolean
          selected_item_ids?: string[]
          source_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          author_name: string | null
          category: string
          content: string
          created_at: string | null
          emoji: string | null
          id: string
          is_published: boolean | null
          read_time_minutes: number | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_name?: string | null
          category: string
          content: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean | null
          read_time_minutes?: number | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean | null
          read_time_minutes?: number | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      mate_interests: {
        Row: {
          created_at: string
          from_pet_id: string
          from_user_id: string
          id: string
          status: string
          to_pet_id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_pet_id: string
          from_user_id: string
          id?: string
          status?: string
          to_pet_id: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_pet_id?: string
          from_user_id?: string
          id?: string
          status?: string
          to_pet_id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mate_interests_from_pet_fkey"
            columns: ["from_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_interests_from_user_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_interests_from_user_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_interests_to_pet_fkey"
            columns: ["to_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_interests_to_user_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_interests_to_user_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mate_matches: {
        Row: {
          created_at: string
          id: string
          pet_id_1: string
          pet_id_2: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id_1: string
          pet_id_2: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id_1?: string
          pet_id_2?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "mate_matches_pet_1_fkey"
            columns: ["pet_id_1"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_matches_pet_2_fkey"
            columns: ["pet_id_2"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_matches_user_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_matches_user_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_matches_user_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mate_matches_user_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nearby_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nearby_listings: {
        Row: {
          address: string | null
          category: string
          city: string
          comment_count: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          locality: string | null
          longitude: number | null
          metadata: Json | null
          phone: string | null
          rating: number | null
          rating_count: number | null
          source: string | null
          state: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category: string
          city: string
          comment_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json | null
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string
          comment_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json | null
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          source?: string | null
          state?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      nearby_ratings: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          rating: number
          review: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          rating: number
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          rating?: number
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          post_id: string | null
          redirect_url: string | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          redirect_url?: string | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          redirect_url?: string | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_blog_articles: {
        Row: {
          author: string | null
          body_text: string | null
          category: string
          category_label: string
          created_at: string
          date_modified: string | null
          date_published: string | null
          excerpt: string | null
          id: string
          image: string | null
          image_alt: string | null
          is_published: boolean
          reading_time_min: number | null
          source: string
          tags: string[] | null
          title: string
          url: string
          word_count: number | null
        }
        Insert: {
          author?: string | null
          body_text?: string | null
          category: string
          category_label: string
          created_at?: string
          date_modified?: string | null
          date_published?: string | null
          excerpt?: string | null
          id: string
          image?: string | null
          image_alt?: string | null
          is_published?: boolean
          reading_time_min?: number | null
          source?: string
          tags?: string[] | null
          title: string
          url: string
          word_count?: number | null
        }
        Update: {
          author?: string | null
          body_text?: string | null
          category?: string
          category_label?: string
          created_at?: string
          date_modified?: string | null
          date_published?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          image_alt?: string | null
          is_published?: boolean
          reading_time_min?: number | null
          source?: string
          tags?: string[] | null
          title?: string
          url?: string
          word_count?: number | null
        }
        Relationships: []
      }
      pet_club_events: {
        Row: {
          banner_url: string | null
          city: string | null
          created_at: string
          description: string | null
          event_date: string | null
          event_time: string | null
          id: string
          location: string | null
          max_attendees: number | null
          title: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          title: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_club_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_club_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_facts: {
        Row: {
          emoji: string | null
          expires_at: string | null
          fact: string
          generated_at: string | null
          id: string
          image_url: string | null
          pet_type: string | null
          pexels_url: string | null
          photographer: string | null
        }
        Insert: {
          emoji?: string | null
          expires_at?: string | null
          fact: string
          generated_at?: string | null
          id?: string
          image_url?: string | null
          pet_type?: string | null
          pexels_url?: string | null
          photographer?: string | null
        }
        Update: {
          emoji?: string | null
          expires_at?: string | null
          fact?: string
          generated_at?: string | null
          id?: string
          image_url?: string | null
          pet_type?: string | null
          pexels_url?: string | null
          photographer?: string | null
        }
        Relationships: []
      }
      pet_friendly_places: {
        Row: {
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          off_leash: boolean | null
          pet_comfort_index: number | null
          pet_menu: boolean | null
          place_type: string | null
          play_area: boolean | null
          rating: number | null
        }
        Insert: {
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name: string
          off_leash?: boolean | null
          pet_comfort_index?: number | null
          pet_menu?: boolean | null
          place_type?: string | null
          play_area?: boolean | null
          rating?: number | null
        }
        Update: {
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          off_leash?: boolean | null
          pet_comfort_index?: number | null
          pet_menu?: boolean | null
          place_type?: string | null
          play_area?: boolean | null
          rating?: number | null
        }
        Relationships: []
      }
      pet_microchips: {
        Row: {
          chip_format: string
          chip_number: string
          city: string | null
          document_name: string | null
          document_size_kb: number | null
          document_type: string | null
          document_uploaded_at: string | null
          document_url: string | null
          id: string
          implant_date: string | null
          is_active: boolean
          notes: string | null
          owner_id: string
          pet_id: string | null
          registered_at: string
          state: string | null
          verification_status: string
          vet_clinic: string | null
          vet_name: string | null
        }
        Insert: {
          chip_format: string
          chip_number: string
          city?: string | null
          document_name?: string | null
          document_size_kb?: number | null
          document_type?: string | null
          document_uploaded_at?: string | null
          document_url?: string | null
          id?: string
          implant_date?: string | null
          is_active?: boolean
          notes?: string | null
          owner_id: string
          pet_id?: string | null
          registered_at?: string
          state?: string | null
          verification_status?: string
          vet_clinic?: string | null
          vet_name?: string | null
        }
        Update: {
          chip_format?: string
          chip_number?: string
          city?: string | null
          document_name?: string | null
          document_size_kb?: number | null
          document_type?: string | null
          document_uploaded_at?: string | null
          document_url?: string | null
          id?: string
          implant_date?: string | null
          is_active?: boolean
          notes?: string | null
          owner_id?: string
          pet_id?: string | null
          registered_at?: string
          state?: string | null
          verification_status?: string
          vet_clinic?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_microchips_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_microchips_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_microchips_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_records: {
        Row: {
          created_at: string | null
          document_date: string | null
          file_name: string | null
          file_size_kb: number | null
          file_url: string
          id: string
          notes: string | null
          owner_id: string
          pet_id: string
          record_type: string
        }
        Insert: {
          created_at?: string | null
          document_date?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url: string
          id?: string
          notes?: string | null
          owner_id: string
          pet_id: string
          record_type: string
        }
        Update: {
          created_at?: string | null
          document_date?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          owner_id?: string
          pet_id?: string
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_years: number | null
          avatar_emoji: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          gender: string | null
          height_cm: number | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          owner_id: string
          pet_type: string
          species: string | null
          updated_at: string | null
        }
        Insert: {
          age_years?: number | null
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          owner_id: string
          pet_type: string
          species?: string | null
          updated_at?: string | null
        }
        Update: {
          age_years?: number | null
          avatar_emoji?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          owner_id?: string
          pet_type?: string
          species?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_validated: boolean | null
          caption: string | null
          comment_count: number | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          is_seed_post: boolean | null
          like_count: number | null
          location: string | null
          media_type: string | null
          media_url: string
          pet_id: string | null
          post_category: string | null
          post_type: string | null
          save_count: number | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_validated?: boolean | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_seed_post?: boolean | null
          like_count?: number | null
          location?: string | null
          media_type?: string | null
          media_url: string
          pet_id?: string | null
          post_category?: string | null
          post_type?: string | null
          save_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_validated?: boolean | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_seed_post?: boolean | null
          like_count?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string
          pet_id?: string | null
          post_category?: string | null
          post_type?: string | null
          save_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          community_default_tab: string | null
          created_at: string | null
          email: string | null
          feed_preferences: string[] | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_seed_user: boolean | null
          location: string | null
          pet_parent_since: number | null
          phone: string | null
          pin_code: string | null
          post_count: number | null
          state: string | null
          updated_at: string | null
          username: string | null
          welcome_email_sent: boolean | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_default_tab?: string | null
          created_at?: string | null
          email?: string | null
          feed_preferences?: string[] | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          is_seed_user?: boolean | null
          location?: string | null
          pet_parent_since?: number | null
          phone?: string | null
          pin_code?: string | null
          post_count?: number | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_default_tab?: string | null
          created_at?: string | null
          email?: string | null
          feed_preferences?: string[] | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_seed_user?: boolean | null
          location?: string | null
          pet_parent_since?: number | null
          phone?: string | null
          pin_code?: string | null
          post_count?: number | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      sauras_coins: {
        Row: {
          coins: number
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string | null
          media_url: string
          pet_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url: string
          pet_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string
          pet_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          administered_date: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          owner_id: string
          pet_id: string
          status: string | null
          vaccine_name: string
          vet_name: string | null
        }
        Insert: {
          administered_date?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          pet_id: string
          status?: string | null
          vaccine_name: string
          vet_name?: string | null
        }
        Update: {
          administered_date?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          pet_id?: string
          status?: string | null
          vaccine_name?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_appointments: {
        Row: {
          appointment_date: string
          clinic_name: string | null
          created_at: string | null
          id: string
          notes: string | null
          owner_id: string
          pet_id: string
          reason: string | null
          status: string | null
          vet_name: string | null
        }
        Insert: {
          appointment_date: string
          clinic_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          pet_id: string
          reason?: string | null
          status?: string | null
          vet_name?: string | null
        }
        Update: {
          appointment_date?: string
          clinic_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          pet_id?: string
          reason?: string | null
          status?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_appointments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_appointments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_availability: {
        Row: {
          consultation_type: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          slot_duration_minutes: number
          start_time: string
          vet_id: string
        }
        Insert: {
          consultation_type?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number
          start_time: string
          vet_id: string
        }
        Update: {
          consultation_type?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          slot_duration_minutes?: number
          start_time?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_availability_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_availability_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_bookings: {
        Row: {
          booking_reference: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          consultation_type: string
          created_at: string | null
          id: string
          is_emergency: boolean | null
          pet_id: string | null
          reason_for_visit: string | null
          reminder_sent: boolean | null
          share_health_records: boolean | null
          slot_id: string
          status: string
          symptoms: string[] | null
          user_id: string
          user_notes: string | null
          vet_id: string
          vet_notes: string | null
        }
        Insert: {
          booking_reference?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          consultation_type?: string
          created_at?: string | null
          id?: string
          is_emergency?: boolean | null
          pet_id?: string | null
          reason_for_visit?: string | null
          reminder_sent?: boolean | null
          share_health_records?: boolean | null
          slot_id: string
          status?: string
          symptoms?: string[] | null
          user_id: string
          user_notes?: string | null
          vet_id: string
          vet_notes?: string | null
        }
        Update: {
          booking_reference?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          consultation_type?: string
          created_at?: string | null
          id?: string
          is_emergency?: boolean | null
          pet_id?: string | null
          reason_for_visit?: string | null
          reminder_sent?: boolean | null
          share_health_records?: boolean | null
          slot_id?: string
          status?: string
          symptoms?: string[] | null
          user_id?: string
          user_notes?: string | null
          vet_id?: string
          vet_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "vet_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_bookings_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_bookings_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_notifications: {
        Row: {
          booking_id: string | null
          channel: string | null
          id: string
          message: string | null
          sent_at: string | null
          status: string | null
          vet_id: string
        }
        Insert: {
          booking_id?: string | null
          channel?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string | null
          vet_id: string
        }
        Update: {
          booking_id?: string | null
          channel?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string | null
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vet_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_notifications_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_notifications_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_prescriptions: {
        Row: {
          booking_id: string
          created_at: string | null
          diagnosis: string | null
          document_url: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          id: string
          instructions: string | null
          medications: Json | null
          owner_id: string | null
          pet_id: string | null
          vet_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          diagnosis?: string | null
          document_url?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          owner_id?: string | null
          pet_id?: string | null
          vet_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          diagnosis?: string | null
          document_url?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          id?: string
          instructions?: string | null
          medications?: Json | null
          owner_id?: string | null
          pet_id?: string | null
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_prescriptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vet_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_prescriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_prescriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_prescriptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_prescriptions_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_prescriptions_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_reviews: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          rating: number
          review_text: string | null
          reviewer_id: string
          vet_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_id: string
          vet_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "vet_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_reviews_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_reviews_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_slots: {
        Row: {
          consultation_type: string | null
          created_at: string | null
          end_time: string
          id: string
          is_emergency: boolean | null
          locked_at: string | null
          locked_by: string | null
          slot_date: string
          start_time: string
          status: string
          vet_id: string
        }
        Insert: {
          consultation_type?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_emergency?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          slot_date: string
          start_time: string
          status?: string
          vet_id: string
        }
        Update: {
          consultation_type?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_emergency?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          slot_date?: string
          start_time?: string
          status?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_slots_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_slots_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_slots_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "public_vets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_slots_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "vets"
            referencedColumns: ["id"]
          },
        ]
      }
      vets: {
        Row: {
          avg_rating: number | null
          bio: string | null
          city: string
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee_inperson: number | null
          created_at: string | null
          email: string
          emergency_fee_inperson: number | null
          full_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          onboarding_status: string | null
          phone: string
          pin_code: string | null
          profile_photo_url: string | null
          specialisations: string[] | null
          state: string
          total_appointments: number | null
          total_reviews: number | null
          user_id: string | null
          vc_india_registration: string | null
          verified_at: string | null
          whatsapp_number: string | null
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          city?: string
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_inperson?: number | null
          created_at?: string | null
          email: string
          emergency_fee_inperson?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string | null
          phone: string
          pin_code?: string | null
          profile_photo_url?: string | null
          specialisations?: string[] | null
          state?: string
          total_appointments?: number | null
          total_reviews?: number | null
          user_id?: string | null
          vc_india_registration?: string | null
          verified_at?: string | null
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          city?: string
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_inperson?: number | null
          created_at?: string | null
          email?: string
          emergency_fee_inperson?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string | null
          phone?: string
          pin_code?: string | null
          profile_photo_url?: string | null
          specialisations?: string[] | null
          state?: string
          total_appointments?: number | null
          total_reviews?: number | null
          user_id?: string | null
          vc_india_registration?: string | null
          verified_at?: string | null
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          feature: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          feature?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          feature?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string | null
          location: string | null
          pet_parent_since: number | null
          post_count: number | null
          state: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          pet_parent_since?: number | null
          post_count?: number | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          pet_parent_since?: number | null
          post_count?: number | null
          state?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_vets: {
        Row: {
          avg_rating: number | null
          bio: string | null
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee_inperson: number | null
          created_at: string | null
          emergency_fee_inperson: number | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          onboarding_status: string | null
          pin_code: string | null
          profile_photo_url: string | null
          specialisations: string[] | null
          state: string | null
          total_appointments: number | null
          total_reviews: number | null
          vc_india_registration: string | null
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_inperson?: number | null
          created_at?: string | null
          emergency_fee_inperson?: number | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string | null
          pin_code?: string | null
          profile_photo_url?: string | null
          specialisations?: string[] | null
          state?: string | null
          total_appointments?: number | null
          total_reviews?: number | null
          vc_india_registration?: string | null
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_inperson?: number | null
          created_at?: string | null
          emergency_fee_inperson?: number | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          onboarding_status?: string | null
          pin_code?: string | null
          profile_photo_url?: string | null
          specialisations?: string[] | null
          state?: string | null
          total_appointments?: number | null
          total_reviews?: number | null
          vc_india_registration?: string | null
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_coins: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      can_manage_prescription_object: {
        Args: { _object_name: string; _user_id: string }
        Returns: boolean
      }
      can_read_prescription_object: {
        Args: { _object_name: string; _user_id: string }
        Returns: boolean
      }
      get_my_vet_profile: {
        Args: never
        Returns: {
          avg_rating: number | null
          bio: string | null
          city: string
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee_inperson: number | null
          created_at: string | null
          email: string
          emergency_fee_inperson: number | null
          full_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          onboarding_status: string | null
          phone: string
          pin_code: string | null
          profile_photo_url: string | null
          specialisations: string[] | null
          state: string
          total_appointments: number | null
          total_reviews: number | null
          user_id: string | null
          vc_india_registration: string | null
          verified_at: string | null
          whatsapp_number: string | null
          years_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_vet_user: { Args: { _user_id: string }; Returns: boolean }
      lookup_microchip: {
        Args: { _chip_number: string }
        Returns: {
          found: boolean
          owner_id: string
          verification_status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
