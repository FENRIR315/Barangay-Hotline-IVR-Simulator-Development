-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "officials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "phone" TEXT,
    "extension" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "officials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caller_phone" TEXT,
    "caller_name" TEXT,
    "call_type" TEXT NOT NULL DEFAULT 'INFORMATION',
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'IN_IVR',
    "assigned_official_id" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" DATETIME,
    "ended_at" DATETIME,
    "duration_sec" INTEGER,
    "recording_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SIMULATOR',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calls_assigned_official_id_fkey" FOREIGN KEY ("assigned_official_id") REFERENCES "officials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "call_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "call_events_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "call_id" TEXT NOT NULL,
    "caller_phone" TEXT,
    "department" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "assigned_official_id" TEXT,
    "queued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" DATETIME,
    "duration_sec" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "call_queue_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_queue_assigned_official_id_fkey" FOREIGN KEY ("assigned_official_id") REFERENCES "officials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emergency_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "call_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'CRITICAL',
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assigned_official_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "emergency_reports_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emergency_reports_assigned_official_id_fkey" FOREIGN KEY ("assigned_official_id") REFERENCES "officials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "call_id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "problem_type" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assigned_official_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "community_reports_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "community_reports_assigned_official_id_fkey" FOREIGN KEY ("assigned_official_id") REFERENCES "officials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "call_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "duration_sec" INTEGER,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_recordings_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "escalation_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "target_official_id" TEXT NOT NULL,
    "timeout_sec" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escalation_rules_target_official_id_fkey" FOREIGN KEY ("target_official_id") REFERENCES "officials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "detail" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "officials_user_id_key" ON "officials"("user_id");

-- CreateIndex
CREATE INDEX "officials_status_idx" ON "officials"("status");

-- CreateIndex
CREATE INDEX "officials_active_idx" ON "officials"("active");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE INDEX "calls_call_type_idx" ON "calls"("call_type");

-- CreateIndex
CREATE INDEX "calls_priority_idx" ON "calls"("priority");

-- CreateIndex
CREATE INDEX "calls_created_at_idx" ON "calls"("created_at");

-- CreateIndex
CREATE INDEX "call_events_call_id_idx" ON "call_events"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "call_queue_call_id_key" ON "call_queue"("call_id");

-- CreateIndex
CREATE INDEX "call_queue_status_idx" ON "call_queue"("status");

-- CreateIndex
CREATE INDEX "call_queue_priority_idx" ON "call_queue"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_reports_call_id_key" ON "emergency_reports"("call_id");

-- CreateIndex
CREATE INDEX "emergency_reports_status_idx" ON "emergency_reports"("status");

-- CreateIndex
CREATE INDEX "emergency_reports_type_idx" ON "emergency_reports"("type");

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_call_id_key" ON "community_reports"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_report_number_key" ON "community_reports"("report_number");

-- CreateIndex
CREATE INDEX "community_reports_status_idx" ON "community_reports"("status");

-- CreateIndex
CREATE INDEX "community_reports_problem_type_idx" ON "community_reports"("problem_type");

-- CreateIndex
CREATE INDEX "announcements_active_idx" ON "announcements"("active");

-- CreateIndex
CREATE INDEX "announcements_start_date_end_date_idx" ON "announcements"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "voice_recordings_call_id_key" ON "voice_recordings"("call_id");

-- CreateIndex
CREATE INDEX "voice_recordings_status_idx" ON "voice_recordings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_rules_name_key" ON "escalation_rules"("name");

-- CreateIndex
CREATE INDEX "escalation_rules_name_step_order_idx" ON "escalation_rules"("name", "step_order");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
