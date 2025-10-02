-- CreateTable
CREATE TABLE "StepGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "dailyTarget" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepGoalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "actualSteps" INTEGER NOT NULL,
    "targetSteps" INTEGER NOT NULL,
    "carryOverSteps" INTEGER NOT NULL DEFAULT 0,
    "excessSteps" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepChallenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetSteps" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepChallengeParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StepChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StepGoal_userId_isActive_idx" ON "StepGoal"("userId", "isActive");

-- CreateIndex
CREATE INDEX "StepLog_userId_date_idx" ON "StepLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StepLog_userId_date_key" ON "StepLog"("userId", "date");

-- CreateIndex
CREATE INDEX "StepChallengeParticipant_challengeId_totalSteps_idx" ON "StepChallengeParticipant"("challengeId", "totalSteps");

-- CreateIndex
CREATE UNIQUE INDEX "StepChallengeParticipant_userId_challengeId_key" ON "StepChallengeParticipant"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "StepLog" ADD CONSTRAINT "StepLog_stepGoalId_fkey" FOREIGN KEY ("stepGoalId") REFERENCES "StepGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepChallengeParticipant" ADD CONSTRAINT "StepChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "StepChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
