CREATE TABLE "canvas_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"canvas_state" text NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hand_gestures" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"gesture_data" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"is_processed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "canvas_data" ADD CONSTRAINT "canvas_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hand_gestures" ADD CONSTRAINT "hand_gestures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;