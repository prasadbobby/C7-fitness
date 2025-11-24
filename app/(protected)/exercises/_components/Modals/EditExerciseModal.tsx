"use client";
import React, { useState, useEffect } from "react";
import { useDisclosure } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import { Input, Textarea, Select, SelectItem, Chip } from "@nextui-org/react";
import { IconPlus, IconX, IconUpload, IconFileImport } from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import ImageUpload from "../ImageUpload";
import { Exercise } from "@prisma/client";

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseUpdated: () => void;
  exercise: Exercise;
}

const CATEGORIES = [
  { value: "strength", label: "Strength" },
  { value: "stretching", label: "Stretching" },
  { value: "plyometrics", label: "Plyometrics" },
  { value: "strongman", label: "Strongman" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "cardio", label: "Cardio" },
  { value: "olympic_weightlifting", label: "Olympic Weightlifting" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

const FORCE_TYPES = [
  { value: "pull", label: "Pull" },
  { value: "push", label: "Push" },
  { value: "static", label: "Static" },
];

const MECHANIC_TYPES = [
  { value: "compound", label: "Compound" },
  { value: "isolation", label: "Isolation" },
];

const EQUIPMENT_TYPES = [
  { value: "body_only", label: "Body Only" },
  { value: "machine", label: "Machine" },
  { value: "other", label: "Other" },
  { value: "foam_roll", label: "Foam Roll" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "barbell", label: "Barbell" },
  { value: "bands", label: "Bands" },
  { value: "medicine_ball", label: "Medicine Ball" },
  { value: "exercise_ball", label: "Exercise Ball" },
  { value: "e_z_curl_bar", label: "E-Z Curl Bar" },
];

const MUSCLES = [
  { value: "abdominals", label: "Abdominals" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "adductors", label: "Adductors" },
  { value: "quadriceps", label: "Quadriceps" },
  { value: "biceps", label: "Biceps" },
  { value: "shoulders", label: "Shoulders" },
  { value: "chest", label: "Chest" },
  { value: "middle_back", label: "Middle Back" },
  { value: "calves", label: "Calves" },
  { value: "glutes", label: "Glutes" },
  { value: "lower_back", label: "Lower Back" },
  { value: "lats", label: "Lats" },
  { value: "triceps", label: "Triceps" },
  { value: "traps", label: "Traps" },
  { value: "forearms", label: "Forearms" },
  { value: "neck", label: "Neck" },
  { value: "abductors", label: "Abductors" },
];

export default function EditExerciseModal({ isOpen, onClose, onExerciseUpdated, exercise }: EditExerciseModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    aliases: [] as string[],
    primary_muscles: [] as string[],
    secondary_muscles: [] as string[],
    force: "",
    level: "",
    mechanic: "",
    equipment: "",
    category: "",
    instructions: [] as string[],
    description: "",
    tips: [] as string[],
    image: "",
  });

  const [newAlias, setNewAlias] = useState("");
  const [newInstruction, setNewInstruction] = useState("");
  const [newTip, setNewTip] = useState("");
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);

  // Pre-populate form with exercise data when modal opens
  useEffect(() => {
    if (isOpen && exercise) {
      setFormData({
        name: exercise.name || "",
        aliases: exercise.aliases || [],
        primary_muscles: exercise.primary_muscles || [],
        secondary_muscles: exercise.secondary_muscles || [],
        force: exercise.force || "",
        level: exercise.level || "",
        mechanic: exercise.mechanic || "",
        equipment: exercise.equipment || "",
        category: exercise.category || "",
        instructions: exercise.instructions || [],
        description: exercise.description || "",
        tips: exercise.tips || [],
        image: exercise.image || "",
      });
    }
  }, [isOpen, exercise]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addToArray = (field: 'aliases' | 'instructions' | 'tips', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));

      if (field === 'aliases') setNewAlias("");
      if (field === 'instructions') setNewInstruction("");
      if (field === 'tips') setNewTip("");
    }
  };

  const removeFromArray = (field: 'aliases' | 'instructions' | 'tips', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const parseJsonData = () => {
    try {
      const parsedData = JSON.parse(jsonInput);

      // Map JSON data to form fields
      const newFormData = {
        name: parsedData.name || formData.name,
        aliases: parsedData.aliases || formData.aliases,
        primary_muscles: parsedData.primaryMuscles || parsedData.primary_muscles || formData.primary_muscles,
        secondary_muscles: parsedData.secondaryMuscles || parsedData.secondary_muscles || formData.secondary_muscles,
        force: parsedData.force || formData.force,
        level: parsedData.level || formData.level,
        mechanic: parsedData.mechanic || formData.mechanic,
        equipment: parsedData.equipment || formData.equipment,
        category: parsedData.category || formData.category,
        instructions: parsedData.instructions || formData.instructions,
        description: parsedData.description || formData.description,
        tips: parsedData.tips || formData.tips,
        image: formData.image, // Keep existing image unless explicitly provided
      };

      setFormData(newFormData);
      setJsonInput("");
      setShowJsonInput(false);
      toast.success("JSON data imported successfully!");
    } catch (error) {
      toast.error("Invalid JSON format. Please check your data and try again.");
      console.error("JSON parsing error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.level || !formData.category) {
      toast.error("Please fill in all required fields (Name, Level, Category)");
      return;
    }

    setLoading(true);
    try {
      // Use uploaded image path if available, otherwise keep existing
      const exerciseDirName = formData.name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_');
      const imagePath = uploadedImagePaths.length > 0
        ? uploadedImagePaths[0]
        : formData.image || `/images/exercises/${exerciseDirName}/images/0.jpg`;

      const response = await fetch(`/api/exercises?id=${exercise.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          force: formData.force || null,
          mechanic: formData.mechanic || null,
          equipment: formData.equipment || null,
          image: imagePath,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success("Exercise updated successfully!");
        onExerciseUpdated();
        handleClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update exercise");
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast.error("Failed to update exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data to original exercise data
    if (exercise) {
      setFormData({
        name: exercise.name || "",
        aliases: exercise.aliases || [],
        primary_muscles: exercise.primary_muscles || [],
        secondary_muscles: exercise.secondary_muscles || [],
        force: exercise.force || "",
        level: exercise.level || "",
        mechanic: exercise.mechanic || "",
        equipment: exercise.equipment || "",
        category: exercise.category || "",
        instructions: exercise.instructions || [],
        description: exercise.description || "",
        tips: exercise.tips || [],
        image: exercise.image || "",
      });
    }
    setNewAlias("");
    setNewInstruction("");
    setNewTip("");
    setUploadedImagePaths([]);
    setJsonInput("");
    setShowJsonInput(false);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Exercise: ${exercise?.name || ''}`}
      size="2xl"
      footer={
        <>
          <Button variant="ghost" onPress={handleClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            Update Exercise
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* JSON Import Section */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IconFileImport size={20} />
              Quick Import
            </h3>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setShowJsonInput(!showJsonInput)}
              startContent={<IconUpload size={16} />}
            >
              {showJsonInput ? "Hide" : "Import JSON"}
            </Button>
          </div>

          {showJsonInput && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paste JSON data to update form fields. You can still modify any field manually after import.
              </p>
              <Textarea
                placeholder={`Paste your JSON data here. Example:
{
  "name": "Push-ups",
  "force": "push",
  "level": "beginner",
  "mechanic": "compound",
  "equipment": "body_only",
  "primaryMuscles": ["chest", "shoulders", "triceps"],
  "secondaryMuscles": ["abdominals"],
  "instructions": ["Start in plank position", "Lower body to ground", "Push back up"],
  "category": "strength"
}`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  color="primary"
                  onPress={parseJsonData}
                  isDisabled={!jsonInput.trim()}
                  startContent={<IconFileImport size={16} />}
                >
                  Import Data
                </Button>
                <Button
                  variant="flat"
                  onPress={() => {
                    setJsonInput("");
                    setShowJsonInput(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <Input
            label="Exercise Name *"
            placeholder="Enter exercise name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            isRequired
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category *"
              placeholder="Select category"
              selectedKeys={formData.category ? [formData.category] : []}
              onSelectionChange={(keys) => handleInputChange("category", Array.from(keys)[0] as string)}
              isRequired
            >
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Level *"
              placeholder="Select level"
              selectedKeys={formData.level ? [formData.level] : []}
              onSelectionChange={(keys) => handleInputChange("level", Array.from(keys)[0] as string)}
              isRequired
            >
              {LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Force Type"
              placeholder="Select force type"
              selectedKeys={formData.force ? [formData.force] : []}
              onSelectionChange={(keys) => handleInputChange("force", Array.from(keys)[0] as string)}
            >
              {FORCE_TYPES.map((force) => (
                <SelectItem key={force.value} value={force.value}>
                  {force.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Mechanic Type"
              placeholder="Select mechanic type"
              selectedKeys={formData.mechanic ? [formData.mechanic] : []}
              onSelectionChange={(keys) => handleInputChange("mechanic", Array.from(keys)[0] as string)}
            >
              {MECHANIC_TYPES.map((mechanic) => (
                <SelectItem key={mechanic.value} value={mechanic.value}>
                  {mechanic.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Select
            label="Equipment"
            placeholder="Select equipment"
            selectedKeys={formData.equipment ? [formData.equipment] : []}
            onSelectionChange={(keys) => handleInputChange("equipment", Array.from(keys)[0] as string)}
          >
            {EQUIPMENT_TYPES.map((equipment) => (
              <SelectItem key={equipment.value} value={equipment.value}>
                {equipment.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Muscles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Muscles</h3>

          <Select
            label="Primary Muscles"
            placeholder="Select primary muscles"
            selectionMode="multiple"
            selectedKeys={formData.primary_muscles}
            onSelectionChange={(keys) => handleInputChange("primary_muscles", Array.from(keys))}
          >
            {MUSCLES.map((muscle) => (
              <SelectItem key={muscle.value} value={muscle.value}>
                {muscle.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Secondary Muscles"
            placeholder="Select secondary muscles"
            selectionMode="multiple"
            selectedKeys={formData.secondary_muscles}
            onSelectionChange={(keys) => handleInputChange("secondary_muscles", Array.from(keys))}
          >
            {MUSCLES.map((muscle) => (
              <SelectItem key={muscle.value} value={muscle.value}>
                {muscle.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Aliases */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aliases</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Add alias"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToArray('aliases', newAlias)}
            />
            <Button size="sm" onPress={() => addToArray('aliases', newAlias)}>
              <IconPlus size={16} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.aliases.map((alias, index) => (
              <Chip
                key={index}
                onClose={() => removeFromArray('aliases', index)}
                variant="flat"
              >
                {alias}
              </Chip>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Instructions</h3>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add instruction step"
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              rows={2}
            />
            <Button size="sm" onPress={() => addToArray('instructions', newInstruction)}>
              <IconPlus size={16} />
            </Button>
          </div>
          <div className="space-y-2">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex justify-between items-start p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <span className="flex-1">{index + 1}. {instruction}</span>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => removeFromArray('instructions', index)}
                >
                  <IconX size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tips</h3>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add tip"
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              rows={2}
            />
            <Button size="sm" onPress={() => addToArray('tips', newTip)}>
              <IconPlus size={16} />
            </Button>
          </div>
          <div className="space-y-2">
            {formData.tips.map((tip, index) => (
              <div key={index} className="flex justify-between items-start p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <span className="flex-1">{tip}</span>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => removeFromArray('tips', index)}
                >
                  <IconX size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>

          <Textarea
            label="Description"
            placeholder="Enter exercise description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
          />

        </div>

        {/* Image Upload Section */}
        <ImageUpload
          exerciseName={formData.name}
          onImagesUploaded={setUploadedImagePaths}
          disabled={loading}
        />
      </div>
    </BottomSheet>
  );
}