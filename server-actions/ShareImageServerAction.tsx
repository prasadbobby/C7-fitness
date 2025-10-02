"use server";
import { ImageResponse } from '@vercel/og';

const data = [
  {
    id: "8394ff79-9df8-4123-8bc1-0a9899d0fa03",
    duration: 1927,
    createdAt: "2024-03-05T14:35:48.561Z",
    WorkoutPlan: {
      name: "Example Workout Plan",
    },
    exercises: [
      {
        id: "08d02227-13f8-4cb9-a33c-fa47b5f1101f",
        exerciseId: "7e55a2eb-4b92-4d00-af92-e24e575179af",
        trackingType: "duration",
        Exercise: {
          name: "Ab Crunch Machine",
        },
        sets: [
          {
            weight: 10,
            reps: null,
            exerciseDuration: 60,
          },
        ],
      },
      {
        id: "507631a9-fa27-43cf-8918-1f0364441a06",
        exerciseId: "c71643b5-8e7f-4fea-9c80-cbe1c84f3066",
        trackingType: "reps",
        Exercise: {
          name: "90/90 Hamstring",
        },
        sets: [
          {
            weight: 21,
            reps: 8,
            exerciseDuration: null,
          },
        ],
      },
      {
        id: "593183b3-a151-46a4-bc82-3a89243f31da",
        exerciseId: "98712f9f-93f6-492f-a98d-f21c5d056b59",
        trackingType: "reps",
        Exercise: {
          name: "Ab Roller",
        },
        sets: [
          {
            weight: 32,
            reps: 8,
            exerciseDuration: null,
          },
        ],
      },
      {
        id: "73f9cefb-d280-4ba5-8ed9-322383a39aed",
        exerciseId: "721365d1-b04e-490a-bd9f-1ace0eabac98",
        trackingType: "reps",
        Exercise: {
          name: "Adductor",
        },
        sets: [
          {
            weight: 21,
            reps: 8,
            exerciseDuration: null,
          },
        ],
      },
    ],
  },
];

export async function ShareImageServerAction() {
  // Use the first workout from the static data
  const workout = data[0];

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#18181b',
          width: '640px',
          height: '240px',
          display: 'flex',
          flexDirection: 'column',
          padding: '50px',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            color: '#A6FF00',
            fontSize: '30px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          {workout.WorkoutPlan.name}
        </div>

        {workout.exercises.map((exercise, index) => {
          const setDetails = exercise.sets
            .map((set) => {
              let details = `Weight: ${set.weight}`;
              if (set.reps !== null) {
                details += `, Reps: ${set.reps}`;
              }
              if (set.exerciseDuration !== null) {
                details += `, Duration: ${set.exerciseDuration}`;
              }
              return details;
            })
            .join(", ");

          return (
            <div
              key={index}
              style={{
                color: '#ffffff',
                fontSize: '16px',
                marginBottom: '10px',
              }}
            >
              {exercise.Exercise.name}: {setDetails}
            </div>
          );
        })}
      </div>
    ),
    {
      width: 640,
      height: 240,
    }
  );

  // Convert to buffer and then to base64
  const buffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return base64;
}
