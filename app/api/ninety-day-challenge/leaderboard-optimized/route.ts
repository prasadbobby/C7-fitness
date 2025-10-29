import { NextRequest, NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const challengeId = url.searchParams.get('challengeId');

    if (!challengeId) {
      return new NextResponse('Challenge ID is required', { status: 400 });
    }


    // Get all participants with optimized post data (photo counts only)
    const participants = await prisma.ninetyDayChallengeParticipant.findMany({
      where: {
        challengeId: challengeId,
        isEnabled: true
      },
      include: {
        challenge: true,
        posts: {
          where: {
            challengeId: challengeId,
          },
          select: {
            id: true,
            date: true,
            sleepHours: true,
            sleepQuality: true,
            mood: true,
            energy: true,
            isFasting: true,
            // Instead of full photos array, calculate photo count
            photos: true, // We'll process this to count only
            createdAt: true,
          },
          orderBy: {
            date: 'desc'
          }
        },
      },
    });


    // Get user roles efficiently (single query)
    const userIds = participants.map(p => p.userId);
    const userRoles = await prisma.userInfo.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      select: {
        userId: true,
        role: true
      }
    });

    const userRoleMap = userRoles.reduce((acc, user) => {
      acc[user.userId] = user.role;
      return acc;
    }, {} as Record<string, string>);

    // Filter out admin participants (but keep if no role found)
    const nonAdminParticipants = participants.filter(participant => {
      const role = userRoleMap[participant.userId];
      return !role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN');
    });


    // Batch fetch user info from Clerk (optimized)
    let participantsWithUserInfo;
    try {
      const clerkUsers = await clerkClient.users.getUserList({
        userId: nonAdminParticipants.map(p => p.userId),
        limit: 100 // Fetch up to 100 users in single request
      });

      const clerkUserMap = clerkUsers.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      participantsWithUserInfo = nonAdminParticipants.map(participant => {
        const clerkUser = clerkUserMap[participant.userId];

        // Optimize post data - convert photos arrays to counts only
        const optimizedPosts = participant.posts.map(post => ({
          ...post,
          photoCount: post.photos ? post.photos.length : 0,
          // Remove the actual photos array to save bandwidth
          photos: undefined
        }));

        return {
          ...participant,
          posts: optimizedPosts,
          user: {
            userId: participant.userId,
            firstName: clerkUser?.firstName || 'Unknown',
            lastName: clerkUser?.lastName || 'User',
            imageUrl: clerkUser?.imageUrl || '',
            isAdmin: false
          }
        };
      });
    } catch (clerkError) {
      console.error('Clerk batch fetch failed:', clerkError);

      // Fallback to individual calls if batch fails (but limit to essential data)
      participantsWithUserInfo = await Promise.all(
        nonAdminParticipants.slice(0, 20).map(async (participant) => { // Limit to 20 participants max
          try {
            const clerkUser = await clerkClient.users.getUser(participant.userId);

            // Optimize post data
            const optimizedPosts = participant.posts.map(post => ({
              ...post,
              photoCount: post.photos ? post.photos.length : 0,
              photos: undefined
            }));

            return {
              ...participant,
              posts: optimizedPosts,
              user: {
                userId: participant.userId,
                firstName: clerkUser.firstName || 'Unknown',
                lastName: clerkUser.lastName || 'User',
                imageUrl: clerkUser.imageUrl || '',
                isAdmin: false
              }
            };
          } catch (userError) {
            console.error(`Failed to fetch user ${participant.userId}:`, userError);

            // Return with minimal data if user fetch fails
            const optimizedPosts = participant.posts.map(post => ({
              ...post,
              photoCount: post.photos ? post.photos.length : 0,
              photos: undefined
            }));

            return {
              ...participant,
              posts: optimizedPosts,
              user: {
                userId: participant.userId,
                firstName: 'Unknown',
                lastName: 'User',
                imageUrl: '',
                isAdmin: false
              }
            };
          }
        })
      );
    }


    return NextResponse.json({
      participants: participantsWithUserInfo,
      challengeStartDate: participants[0]?.challenge?.startDate || null,
    });

  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}