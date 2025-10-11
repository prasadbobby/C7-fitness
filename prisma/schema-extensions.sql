-- Database Schema Extensions for Rest Timer & Multi-User Gym Management
-- Add these to the existing Prisma schema

-- 1. Extend SetLog to include rest time tracking
-- Add to existing SetLog model:
ALTER TABLE "SetLog"
ADD COLUMN "restTimeSeconds" INTEGER DEFAULT 0,
ADD COLUMN "restStartTime" TIMESTAMP,
ADD COLUMN "restEndTime" TIMESTAMP,
ADD COLUMN "setStartTime" TIMESTAMP,
ADD COLUMN "setEndTime" TIMESTAMP;

-- 2. Extend WorkoutLog to include total rest time
-- Add to existing WorkoutLog model:
ALTER TABLE "WorkoutLog"
ADD COLUMN "totalRestTimeSeconds" INTEGER DEFAULT 0,
ADD COLUMN "totalActiveTimeSeconds" INTEGER DEFAULT 0;

-- 3. New WorkoutSession model for real-time session management
CREATE TABLE "WorkoutSession" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "workoutLogId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, REST, COMPLETED
    "startTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "pausedTime" TIMESTAMP,
    "currentExerciseId" TEXT,
    "currentSetIndex" INTEGER DEFAULT 0,
    "restTimerStartTime" TIMESTAMP,
    "restTimerDuration" INTEGER, -- Recommended rest duration
    "lastActivity" TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),

    -- Foreign keys
    FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog"("id") ON DELETE CASCADE
);

-- 4. New GymSession model for admin multi-user management
CREATE TABLE "GymSession" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "adminUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "endTime" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "maxParticipants" INTEGER DEFAULT 50,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 5. GymSessionParticipant for tracking users in gym sessions
CREATE TABLE "GymSessionParticipant" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "gymSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutSessionId" TEXT,
    "joinedAt" TIMESTAMP DEFAULT NOW(),
    "leftAt" TIMESTAMP,
    "status" TEXT DEFAULT 'JOINED', -- JOINED, WORKING_OUT, RESTING, LEFT

    -- Foreign keys
    FOREIGN KEY ("gymSessionId") REFERENCES "GymSession"("id") ON DELETE CASCADE,
    FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE SET NULL,

    -- Unique constraint
    UNIQUE("gymSessionId", "userId")
);

-- 6. RestTimer model for configurable rest periods
CREATE TABLE "RestTimer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "exerciseId" TEXT,
    "workoutPlanId" TEXT,
    "defaultRestSeconds" INTEGER NOT NULL DEFAULT 60,
    "minRestSeconds" INTEGER DEFAULT 30,
    "maxRestSeconds" INTEGER DEFAULT 300,
    "autoStart" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),

    -- Foreign keys
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE,
    FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE
);

-- 7. SessionTimer for real-time timer management
CREATE TABLE "SessionTimer" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "workoutSessionId" TEXT NOT NULL,
    "timerType" TEXT NOT NULL, -- 'WORKOUT', 'REST', 'EXERCISE'
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP,
    "pausedAt" TIMESTAMP,
    "duration" INTEGER DEFAULT 0, -- Current duration in seconds
    "targetDuration" INTEGER, -- Target duration for rest timers
    "isActive" BOOLEAN DEFAULT true,
    "exerciseId" TEXT, -- For exercise-specific timers
    "setNumber" INTEGER, -- For set-specific rest timers

    -- Foreign keys
    FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE,
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX "idx_workout_session_user_status" ON "WorkoutSession"("userId", "status");
CREATE INDEX "idx_gym_session_admin_active" ON "GymSession"("adminUserId", "isActive");
CREATE INDEX "idx_session_participant_gym_status" ON "GymSessionParticipant"("gymSessionId", "status");
CREATE INDEX "idx_session_timer_workout_type" ON "SessionTimer"("workoutSessionId", "timerType");
CREATE INDEX "idx_setlog_rest_time" ON "SetLog"("restTimeSeconds");

-- Views for admin dashboard
CREATE VIEW "ActiveGymSessions" AS
SELECT
    gs."id",
    gs."name",
    gs."adminUserId",
    gs."startTime",
    COUNT(gsp."id") as "participantCount",
    COUNT(CASE WHEN gsp."status" = 'WORKING_OUT' THEN 1 END) as "activeWorkouts",
    COUNT(CASE WHEN gsp."status" = 'RESTING' THEN 1 END) as "restingUsers"
FROM "GymSession" gs
LEFT JOIN "GymSessionParticipant" gsp ON gs."id" = gsp."gymSessionId"
WHERE gs."isActive" = true
GROUP BY gs."id", gs."name", gs."adminUserId", gs."startTime";

-- View for user workout summaries with rest time
CREATE VIEW "WorkoutSummaryWithRest" AS
SELECT
    wl."id",
    wl."userId",
    wl."date",
    wl."duration" as "totalWorkoutSeconds",
    wl."totalRestTimeSeconds",
    wl."totalActiveTimeSeconds",
    (wl."duration" - COALESCE(wl."totalRestTimeSeconds", 0)) as "calculatedActiveTime",
    COUNT(wle."id") as "exerciseCount",
    SUM(
        (SELECT COUNT(*) FROM "SetLog" sl WHERE sl."workoutLogExerciseId" = wle."id")
    ) as "totalSets"
FROM "WorkoutLog" wl
LEFT JOIN "WorkoutLogExercise" wle ON wl."id" = wle."workoutLogId"
WHERE wl."inProgress" = false
GROUP BY wl."id", wl."userId", wl."date", wl."duration", wl."totalRestTimeSeconds", wl."totalActiveTimeSeconds";