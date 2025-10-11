import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      duration,
      totalRestTime,
      totalActiveTime,
      workoutPlanId,
      exercises
    } = data;

    // Validate required fields
    if (!workoutPlanId || !exercises) {
      return NextResponse.json(
        { error: "Missing required fields: workoutPlanId and exercises" },
        { status: 400 }
      );
    }

    // Verify the workout plan exists
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: workoutPlanId }
    });

    if (!workoutPlan) {
      return NextResponse.json(
        { error: "Workout plan not found" },
        { status: 404 }
      );
    }

    // Create the workout log with timing data
    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId,
        workoutPlanId,
        date: new Date(),
        duration: duration || 0,
        totalRestTimeSeconds: totalRestTime || 0,
        totalActiveTimeSeconds: totalActiveTime || 0,
        inProgress: false, // Mark as completed
        exercises: {
          create: Object.entries(exercises).map(([exerciseId, exerciseData]: [string, any]) => ({
            exerciseId,
            trackingType: exerciseData.sets?.[0]?.exerciseDuration ? 'duration' : 'reps',
            sets: {
              create: exerciseData.sets.map((set: any, index: number) => ({
                weight: set.weight ? parseFloat(set.weight) : null,
                reps: set.reps ? parseInt(set.reps) : null,
                exerciseDuration: set.exerciseDuration ? parseInt(set.exerciseDuration) : null,
                order: index + 1,
              }))
            }
          }))
        }
      },
      include: {
        exercises: {
          include: {
            sets: true,
            Exercise: {
              select: {
                name: true
              }
            }
          }
        },
        WorkoutPlan: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate and update personal bests if applicable
    try {
      for (const [exerciseId, exerciseData] of Object.entries(exercises)) {
        const exerciseTyped = exerciseData as any;
        for (const set of exerciseTyped.sets) {
          if (set.weight && (set.reps || set.exerciseDuration)) {
            const weight = parseFloat(set.weight);
            const reps = set.reps ? parseInt(set.reps) : null;
            const duration = set.exerciseDuration ? parseInt(set.exerciseDuration) : null;

            // Check if this is a new personal best
            const existingPB = await prisma.userExercisePB.findUnique({
              where: {
                userId_exerciseId: {
                  userId,
                  exerciseId
                }
              }
            });

            const shouldUpdatePB = !existingPB ||
              (weight > existingPB.weight) ||
              (weight === existingPB.weight && reps && existingPB.reps && reps > existingPB.reps) ||
              (weight === existingPB.weight && duration && existingPB.exerciseDuration && duration > existingPB.exerciseDuration);

            if (shouldUpdatePB) {
              await prisma.userExercisePB.upsert({
                where: {
                  userId_exerciseId: {
                    userId,
                    exerciseId
                  }
                },
                update: {
                  weight,
                  reps,
                  exerciseDuration: duration,
                  workoutLogId: workoutLog.id
                },
                create: {
                  userId,
                  exerciseId,
                  weight,
                  reps,
                  exerciseDuration: duration,
                  workoutLogId: workoutLog.id
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error updating personal bests:", error);
      // Don't fail the entire request if PB update fails
    }

    return NextResponse.json({
      success: true,
      message: "Workout saved successfully",
      workoutLog: {
        id: workoutLog.id,
        duration: workoutLog.duration,
        totalRestTime: workoutLog.totalRestTimeSeconds,
        totalActiveTime: workoutLog.totalActiveTimeSeconds,
        exerciseCount: workoutLog.exercises.length,
        workoutPlanName: workoutLog.WorkoutPlan.name
      }
    });

  } catch (error) {
    console.error("Error saving workout:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save workout",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [workoutLogs, total] = await Promise.all([
      prisma.workoutLog.findMany({
        where: {
          userId,
          inProgress: false // Only completed workouts
        },
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          WorkoutPlan: {
            select: {
              name: true
            }
          },
          exercises: {
            include: {
              Exercise: {
                select: {
                  name: true
                }
              },
              sets: {
                orderBy: { order: "asc" }
              }
            }
          }
        }
      }),
      prisma.workoutLog.count({
        where: {
          userId,
          inProgress: false
        }
      })
    ]);

    return NextResponse.json({
      workoutLogs,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error("Error fetching workout logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout logs" },
      { status: 500 }
    );
  }
}