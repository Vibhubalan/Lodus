CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"target_user_id" integer,
	"channel" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "daily_plan_acceptances" (
	"id" serial PRIMARY KEY NOT NULL,
	"daily_plan_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"plan_date" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_date" text NOT NULL,
	"title" text NOT NULL,
	"meeting_date" text,
	"meeting_time" text,
	"place" text,
	"notes" text,
	"set_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_games" (
	"member_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	CONSTRAINT "member_games_member_id_game_id_pk" PRIMARY KEY("member_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"tagline" text,
	"bio" text,
	"discord" text,
	"instagram" text,
	"youtube" text,
	"linkedin" text,
	"nickname" text,
	"name_updated_at" timestamp with time zone,
	"skills" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'offline' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"show_in_leadership" boolean DEFAULT false NOT NULL,
	"show_in_team" boolean DEFAULT false NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text DEFAULT '#9a8a90' NOT NULL,
	"permissions" text DEFAULT '{}' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"tagline" text DEFAULT 'Our group. Our games. Our space.' NOT NULL,
	"about_title" text DEFAULT 'About Lodus' NOT NULL,
	"about_image_url" text DEFAULT '/images/about/lodus-photo.png' NOT NULL,
	"about_markdown" text NOT NULL,
	"story_markdown" text,
	"founded_label" text DEFAULT 'March 2024' NOT NULL,
	"founded_history" text NOT NULL,
	"pinned_note" text,
	"highlights_json" text DEFAULT '[]' NOT NULL,
	"homepage_json" text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"has_custom_password" boolean DEFAULT false NOT NULL,
	"name" text,
	"phone" text,
	"birthdate" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"status" text DEFAULT 'applied' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_channel" text,
	"role_id" integer,
	"application_message" text,
	"auth_provider" text DEFAULT 'credentials' NOT NULL,
	"provider_account_id" text,
	"instagram" text,
	"youtube" text,
	"linkedin" text,
	"nickname" text,
	"name_updated_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_acceptances" ADD CONSTRAINT "daily_plan_acceptances_daily_plan_id_daily_plans_id_fk" FOREIGN KEY ("daily_plan_id") REFERENCES "public"."daily_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_acceptances" ADD CONSTRAINT "daily_plan_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_set_by_user_id_users_id_fk" FOREIGN KEY ("set_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_games" ADD CONSTRAINT "member_games_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_games" ADD CONSTRAINT "member_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_plan_acceptances_user_plan_date_idx" ON "daily_plan_acceptances" USING btree ("user_id","plan_date");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_provider_account_id_idx" ON "users" USING btree ("provider_account_id");