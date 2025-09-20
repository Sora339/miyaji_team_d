import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const handGestures = pgTable('hand_gestures', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  gestureData: text('gesture_data').notNull(), // JSON string for hand landmark data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  isProcessed: boolean('is_processed').default(false),
})

export const canvasData = pgTable('canvas_data', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  canvasState: text('canvas_state').notNull(), // JSON string for Fabric.js canvas state
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})