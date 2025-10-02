// Run with:
// npx ts-node --compiler-options '{"module":"commonjs"}' prisma/scripts/MigrateExercises.ts

import { PrismaClient, Muscle, ForceType, LevelType, MechanicType, EquipmentType, CategoryType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExerciseJSON {
  name: string;
  force?: string;
  level: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  description?: string;
  tips?: string[];
}

// Map JSON values to enum values
const mapForceType = (force: string | undefined): ForceType | null => {
  if (!force) return null;
  switch (force.toLowerCase()) {
    case "pull": return ForceType.pull;
    case "push": return ForceType.push;
    case "static": return ForceType.static;
    default: return null;
  }
};

const mapLevelType = (level: string): LevelType => {
  switch (level.toLowerCase()) {
    case "beginner": return LevelType.beginner;
    case "intermediate": return LevelType.intermediate;
    case "expert": return LevelType.expert;
    default: return LevelType.beginner;
  }
};

const mapMechanicType = (mechanic: string | undefined): MechanicType | null => {
  if (!mechanic) return null;
  switch (mechanic.toLowerCase()) {
    case "compound": return MechanicType.compound;
    case "isolation": return MechanicType.isolation;
    default: return null;
  }
};

const mapEquipmentType = (equipment: string | undefined): EquipmentType | null => {
  if (!equipment) return null;
  const equipmentMap: { [key: string]: EquipmentType } = {
    "body only": EquipmentType.body_only,
    "machine": EquipmentType.machine,
    "other": EquipmentType.other,
    "foam roll": EquipmentType.foam_roll,
    "kettlebells": EquipmentType.kettlebells,
    "dumbbell": EquipmentType.dumbbell,
    "cable": EquipmentType.cable,
    "barbell": EquipmentType.barbell,
    "bands": EquipmentType.bands,
    "medicine ball": EquipmentType.medicine_ball,
    "exercise ball": EquipmentType.exercise_ball,
    "e-z curl bar": EquipmentType.e_z_curl_bar
  };
  return equipmentMap[equipment.toLowerCase()] || null;
};

const mapCategoryType = (category: string): CategoryType => {
  const categoryMap: { [key: string]: CategoryType } = {
    "strength": CategoryType.strength,
    "stretching": CategoryType.stretching,
    "plyometrics": CategoryType.plyometrics,
    "strongman": CategoryType.strongman,
    "powerlifting": CategoryType.powerlifting,
    "cardio": CategoryType.cardio,
    "olympic weightlifting": CategoryType.olympic_weightlifting
  };
  return categoryMap[category.toLowerCase()] || CategoryType.strength;
};

const mapMuscleType = (muscle: string): Muscle | null => {
  const muscleMap: { [key: string]: Muscle } = {
    "abdominals": Muscle.abdominals,
    "hamstrings": Muscle.hamstrings,
    "adductors": Muscle.adductors,
    "quadriceps": Muscle.quadriceps,
    "biceps": Muscle.biceps,
    "shoulders": Muscle.shoulders,
    "chest": Muscle.chest,
    "middle back": Muscle.middle_back,
    "calves": Muscle.calves,
    "glutes": Muscle.glutes,
    "lower back": Muscle.lower_back,
    "lats": Muscle.lats,
    "triceps": Muscle.triceps,
    "traps": Muscle.traps,
    "forearms": Muscle.forearms,
    "neck": Muscle.neck,
    "abductors": Muscle.abductors
  };
  return muscleMap[muscle.toLowerCase()] || null;
};

async function migrateExercises() {
  const exerciseDir = path.join(process.cwd(), "public", "images", "exercises");

  if (!fs.existsSync(exerciseDir)) {
    console.log("Exercise directory not found:", exerciseDir);
    return;
  }

  const exerciseFolders = fs.readdirSync(exerciseDir).filter(folder =>
    fs.statSync(path.join(exerciseDir, folder)).isDirectory()
  );

  console.log(`Found ${exerciseFolders.length} exercise folders`);

  for (const folder of exerciseFolders) {
    const exerciseJsonPath = path.join(exerciseDir, folder, "exercise.json");

    if (!fs.existsSync(exerciseJsonPath)) {
      console.log(`No exercise.json found for ${folder}`);
      continue;
    }

    try {
      const exerciseData: ExerciseJSON = JSON.parse(fs.readFileSync(exerciseJsonPath, "utf-8"));

      // Check if exercise already exists
      const existingExercise = await prisma.exercise.findFirst({
        where: { name: exerciseData.name }
      });

      if (existingExercise) {
        console.log(`Exercise already exists: ${exerciseData.name}`);
        continue;
      }

      // Map muscles and filter out invalid ones
      const primaryMuscles = exerciseData.primaryMuscles
        .map(mapMuscleType)
        .filter((muscle): muscle is Muscle => muscle !== null);

      const secondaryMuscles = exerciseData.secondaryMuscles
        .map(mapMuscleType)
        .filter((muscle): muscle is Muscle => muscle !== null);

      // Create exercise
      await prisma.exercise.create({
        data: {
          name: exerciseData.name,
          aliases: [], // Start with empty aliases
          primary_muscles: primaryMuscles,
          secondary_muscles: secondaryMuscles,
          force: mapForceType(exerciseData.force),
          level: mapLevelType(exerciseData.level),
          mechanic: mapMechanicType(exerciseData.mechanic),
          equipment: mapEquipmentType(exerciseData.equipment),
          category: mapCategoryType(exerciseData.category),
          instructions: exerciseData.instructions,
          description: exerciseData.description || null,
          tips: exerciseData.tips || [],
          image: `/images/exercises/${folder}/0.jpg` // Assuming first image
        }
      });

      console.log(`Migrated exercise: ${exerciseData.name}`);
    } catch (error) {
      console.error(`Error migrating exercise ${folder}:`, error);
    }
  }
}

async function main() {
  console.log("Starting exercise migration...");
  await migrateExercises();
  console.log("Exercise migration completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });