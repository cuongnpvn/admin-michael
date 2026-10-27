/**
 * Supabase-generated-style Database types for the TOEIC content schema.
 * Regenerate with: Supabase MCP `generate_typescript_types` or `supabase gen types typescript`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      answer_options: TableDef;
      answer_key_uploads: TableDef;
      answer_keys: TableDef;
      books: TableDef;
      learning_activities: TableDef;
      exam_last_attempts: TableDef;
      exam_live_sessions: TableDef;
      classes: TableDef;
      class_members: TableDef;
      class_assignments: TableDef;
      class_assignment_questions: TableDef;
      class_assignment_question_keys: TableDef;
      class_assignment_attempts: TableDef;
      notebook_notes: TableDef;
      notebook_word_entries: TableDef;
      notebooks: TableDef;
      user_daily_goals: TableDef;
      user_daily_goal_completions: TableDef;
      listening_groups: TableDef;
      listening_part1_items: TableDef;
      listening_part2_items: TableDef;
      media_assets: TableDef;
      profiles: TableDef;
      questions: TableDef;
      reading_passage_sets: TableDef;
      reading_passages: TableDef;
      test_parts: TableDef;
      tests: TableDef;
      vocabulary_decks: TableDef;
      vocabulary_items: TableDef;
      vocabulary_card_progress: TableDef;
      blog_posts: TableDef;
      blog_comments: TableDef;
      blog_likes: TableDef;
      lecture_collections: TableDef;
      lecture_collection_stages: TableDef;
      lectures: TableDef;
      lecture_questions: TableDef;
      lecture_enrollments: TableDef;
      lecture_practice_questions: TableDef;
      lecture_vocab_items: TableDef;
      lecture_question_keys: TableDef;
      lecture_chunks: TableDef;
      user_lecture_state: TableDef;
      user_lecture_progress: TableDef;
      user_lecture_finishes: TableDef;
      community_chat_messages: TableDef;
      lecture_tutor_asks: TableDef;
      dictionary_lookup_cache: TableDef;
      dictation_sets: TableDef;
      dictation_items: TableDef;
      dictation_item_reviews: TableDef;
      practice_difficulty_feedback: TableDef;
      subscriptions: TableDef;
      notification_preferences: TableDef;
      notification_campaigns: TableDef;
      user_notifications: TableDef;
    };
    Views: {
      practice_difficulty_stats: TableDef;
    };
    Functions: {
      match_lecture_chunks: {
        Args: {
          query_embedding: number[];
          p_lecture_id?: string | null;
          p_collection_id?: string | null;
          p_source_kinds?: string[] | null;
          match_count?: number;
        };
        Returns: {
          id: string;
          lecture_id: string;
          collection_id: string;
          source_kind: string;
          heading: string;
          question_id: string | null;
          content: string;
          similarity: number;
        }[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_pro_access: { Args: Record<string, never>; Returns: boolean };
      consume_lecture_tutor_rate_limit: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      record_lecture_active_seconds: {
        Args: {
          p_lecture_id: string;
          p_collection_id: string;
          p_seconds: number;
        };
        Returns: number;
      };
      can_access_test_tier: {
        Args: { tier: Database["public"]["Enums"]["subscription_plan"] };
        Returns: boolean;
      };
      is_teacher: { Args: Record<string, never>; Returns: boolean };
      is_class_owner: { Args: { p_class_id: string }; Returns: boolean };
      get_default_class_id: { Args: Record<string, never>; Returns: string };
      is_class_member: { Args: { p_class_id: string }; Returns: boolean };
      is_class_teacher: { Args: { p_class_id: string }; Returns: boolean };
      is_class_student_user: {
        Args: { p_class_id: string; p_user_id: string };
        Returns: boolean;
      };
      can_teacher_view_student: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      is_test_counts_valid: {
        Args: { p_book_id: string; p_test_id: string };
        Returns: boolean;
      };
      reorder_part_questions: {
        Args: {
          p_book_id: string;
          p_test_id: string;
          p_part: Database["public"]["Enums"]["toeic_part"];
          p_ordered_question_ids: string[];
        };
        Returns: undefined;
      };
      validate_test_question_counts: {
        Args: { p_book_id: string; p_test_id: string };
        Returns: {
          actual_count: number;
          expected_count: number;
          is_valid: boolean;
          part: Database["public"]["Enums"]["toeic_part"];
        }[];
      };
      increment_blog_share_count: {
        Args: { p_post_id: string };
        Returns: number;
      };
      owns_notebook: {
        Args: { p_notebook_id: string };
        Returns: boolean;
      };
      can_read_vocabulary_deck: {
        Args: { p_deck_id: string };
        Returns: boolean;
      };
      can_write_vocabulary_deck: {
        Args: { p_deck_id: string };
        Returns: boolean;
      };
      export_vocabulary_deck: {
        Args: { p_source_deck_id: string; p_new_name?: string | null };
        Returns: string;
      };
      invoke_send_learning_reminders: {
        Args: Record<string, never>;
        Returns: number;
      };
      invoke_send_dictation_reminders: {
        Args: Record<string, never>;
        Returns: number;
      };
      list_class_students: {
        Args: {
          p_class_id: string;
          p_offset?: number;
          p_limit?: number;
          p_query?: string;
        };
        Returns: {
          member_id: string;
          user_id: string;
          display_name: string;
          email: string | null;
          display_name_override: string | null;
          external_student_id: string | null;
          joined_at: string;
          status: Database["public"]["Enums"]["class_member_status"];
          last_test_book_id: string | null;
          last_test_test_id: string | null;
          last_test_finished_time: number | null;
          last_exam_score: number | null;
          exams_completed: number;
          total_count: number;
        }[];
      };
      admin_list_users: {
        Args: {
          p_offset?: number;
          p_limit?: number;
          p_sort?: string;
          p_ascending?: boolean;
          p_plan?: string;
          p_query?: string;
        };
        Returns: {
          id: string;
          display_name: string | null;
          is_admin: boolean;
          email: string | null;
          plan: Database["public"]["Enums"]["subscription_plan"];
          subscription_status: Database["public"]["Enums"]["subscription_status"] | null;
          current_period_end: string | null;
          total_count: number;
        }[];
      };
      get_full_exam_score_stats: {
        Args: {
          p_book_id: string;
          p_test_id: string;
          p_include_all?: boolean;
        };
        Returns: {
          id: string;
          is_own: boolean;
          listening_score: number;
          reading_score: number;
          total_score: number;
          finished_time: number | null;
          completed_at: string;
        }[];
      };
    };
    Enums: {
      answer_key_section: "listening" | "reading" | "full";
      subscription_plan: "free" | "pro";
      subscription_status: "active" | "canceled" | "expired" | "past_due";
      listening_format: "dialogue" | "monologue";
      listening_stimulus_kind:
        | "conversation"
        | "announcement"
        | "voicemail"
        | "radio_ad"
        | "report"
        | "instructions"
        | "tour_talk"
        | "other";
      media_kind: "image" | "audio" | "pdf";
      option_label: "A" | "B" | "C" | "D";
      passage_set_content_model: "comprehension" | "text_completion_cloze";
      passage_set_layout: "single" | "double" | "triple";
      learning_activity_type: "exam" | "practice" | "vocabulary";
      user_role: "student" | "teacher";
      class_member_role: "student" | "teacher";
      class_member_status: "active" | "removed";
      toeic_part: "1" | "2" | "3" | "4" | "5" | "6" | "7";
      vocabulary_section: "listening" | "reading";
      dictation_item_type:
        | "image_description"
        | "question_answer"
        | "conversation"
        | "monologue";
      vocabulary_card_status: "new" | "again" | "hard" | "easy";
      vocabulary_card_grade: "again" | "hard" | "easy";
      notification_category:
        | "learning_reminder"
        | "content_release"
        | "marketing"
        | "system";
      notification_kind:
        | "daily_goal_missed"
        | "vocab_due"
        | "practice_nudge"
        | "exam_retry"
        | "inactive"
        | "content_release"
        | "promo"
        | "system"
        | "class_assignment"
        | "dictation_due"
        | "lecture_due";
      notification_campaign_status: "draft" | "sending" | "sent" | "cancelled";
      notification_audience: "all" | "free" | "pro" | "active_7d";
      lecture_format: "lesson" | "practice" | "vocab";
      lecture_exercise_kind:
        | "multiple_choice"
        | "highlight"
        | "rewrite"
        | "fill_blank";
      lecture_enrollment_status: "active" | "completed" | "canceled";
      lecture_extract_status: "idle" | "extracting" | "ready" | "failed";
      lecture_progress_status: "started" | "finished";
      lecture_progress_focus: "content" | "exercise";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
