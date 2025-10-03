import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Get user's active challenge
    const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
    });

    let challengeId;

    if (participant) {
      challengeId = participant.challengeId;
    } else if (isAdmin) {
      // Admin without participant - get active challenge
      const activeChallenge = await prisma.ninetyDayChallenge.findFirst({
        where: { isActive: true }
      });

      if (!activeChallenge) {
        return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
      }

      challengeId = activeChallenge.id;
    } else {
      return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    // Get posts from all participants in the same challenge
    const [posts, total] = await Promise.all([
      prisma.ninetyDayChallengePost.findMany({
        where: {
          challengeId: challengeId,
        },
        include: {
          reactions: true,
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.ninetyDayChallengePost.count({
        where: {
          challengeId: challengeId,
        },
      }),
    ]);

    // Get user details from Clerk for each post
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        try {
          const postUser = await clerkClient.users.getUser(post.userId);
          return {
            ...post,
            user: {
              firstName: postUser.firstName || "",
              lastName: postUser.lastName || "",
              imageUrl: postUser.imageUrl || "",
            },
          };
        } catch (error) {
          console.error(`Error fetching user ${post.userId}:`, error);
          return {
            ...post,
            user: {
              firstName: "Unknown",
              lastName: "User",
              imageUrl: "",
            },
          };
        }
      })
    );

    return NextResponse.json({
      posts: postsWithUserInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type');
    let formData;

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (from admin modal)
      formData = await request.formData();

      var date = formData.get('date') as string;
      var sleepHours = formData.get('sleepHours') ? Number(formData.get('sleepHours')) : null;
      var sleepQuality = formData.get('sleepQuality') as string;
      var mealTracking = formData.get('mealTracking') as string;
      var dayDescription = formData.get('dayDescription') as string;
      var mood = formData.get('mood') as string;
      var energy = formData.get('energy') as string;
      var achievements = formData.get('achievements') as string;
      var challenges = formData.get('challenges') as string;

      // Handle photo files
      var photos: string[] = [];
      const photoFiles = formData.getAll('photos') as File[];
      for (const file of photoFiles) {
        if (file && file.size > 0) {
          // Convert file to base64 data URL for simple storage
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          photos.push(dataUrl);
        }
      }
    } else {
      // Handle JSON (from existing forms)
      const jsonData = await request.json();
      var { date, sleepHours, sleepQuality, mealTracking, dayDescription, mood, energy, achievements, challenges, photos } = jsonData;
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true }
    });

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN';

    // Get user's active challenge participation
    const participant = await prisma.ninetyDayChallengeParticipant.findFirst({
      where: {
        userId: user.id,
        isEnabled: true,
        challenge: {
          isActive: true,
        },
      },
    });

    let challengeId;
    let participantId;

    if (participant) {
      challengeId = participant.challengeId;
      participantId = participant.id;
    } else if (isAdmin) {
      // Admin without participant - get active challenge and create participant record
      const activeChallenge = await prisma.ninetyDayChallenge.findFirst({
        where: { isActive: true }
      });

      if (!activeChallenge) {
        return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
      }

      // Create or get admin participant record
      const adminParticipant = await prisma.ninetyDayChallengeParticipant.upsert({
        where: {
          userId_challengeId: {
            userId: user.id,
            challengeId: activeChallenge.id,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          userId: user.id,
          challengeId: activeChallenge.id,
          isEnabled: true,
        },
      });

      challengeId = activeChallenge.id;
      participantId = adminParticipant.id;
    } else {
      return NextResponse.json({ error: "No active challenge found" }, { status: 404 });
    }

    // Check if user already posted for this date
    const existingPost = await prisma.ninetyDayChallengePost.findUnique({
      where: {
        userId_challengeId_date: {
          userId: user.id,
          challengeId: challengeId,
          date: new Date(date),
        },
      },
    });

    if (existingPost) {
      return NextResponse.json({ error: "Post already exists for this date" }, { status: 400 });
    }

    const post = await prisma.ninetyDayChallengePost.create({
      data: {
        userId: user.id,
        challengeId: challengeId,
        participantId: participantId,
        date: new Date(date),
        sleepHours,
        sleepQuality: sleepQuality || null,
        mealTracking,
        dayDescription,
        mood: mood || null,
        energy: energy || null,
        achievements,
        challenges,
        photos: photos || [],
      },
    });

    // Update participant's completed days and last active date
    await prisma.ninetyDayChallengeParticipant.update({
      where: { id: participantId },
      data: {
        completedDays: { increment: 1 },
        lastActiveDate: new Date(),
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}