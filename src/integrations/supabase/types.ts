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
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          recipient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
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
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_default_tab?: string | null
          created_at?: string | null
          email?: string | null
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
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          community_default_tab?: string | null
          created_at?: string | null
          email?: string | null
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
    }
    Functions: {
      [_ in never]: never
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
