"use client";
import React, { useState } from "react";
import { useDisclosure } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import { Input, Textarea, Select, SelectItem, Chip } from "@nextui-org/react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import ImageUpload from "../ImageUpload";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: () => void;
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

export default function AddExerciseModal({ isOpen, onClose, onExerciseAdded }: AddExerciseModalProps) {
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.level || !formData.category) {
      toast.error("Please fill in all required fields (Name, Level, Category)");
      return;
    }

    setLoading(true);
    try {
      // Use the first uploaded image path, or generate default if no images uploaded
      const exerciseDirName = formData.name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_{2,}/g, '_');
      const imagePath = uploadedImagePaths.length > 0
        ? uploadedImagePaths[0]
        : `/images/exercises/${exerciseDirName}/images/0.jpg`;

      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          force: formData.force || null,
          mechanic: formData.mechanic || null,
          equipment: formData.equipment || null,
          image: imagePath, // Auto-generated image path
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success("Exercise created successfully! Directory structure has been set up.");
        console.log("Created directories:", responseData.directories);
        onExerciseAdded();
        handleClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create exercise");
      }
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error("Failed to create exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      aliases: [],
      primary_muscles: [],
      secondary_muscles: [],
      force: "",
      level: "",
      mechanic: "",
      equipment: "",
      category: "",
      instructions: [],
      description: "",
      tips: [],
      image: "",
    });
    setNewAlias("");
    setNewInstruction("");
    setNewTip("");
    setUploadedImagePaths([]);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Exercise"
      size="2xl"
      footer={
        <>
          <Button variant="ghost" onPress={handleClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            Create Exercise
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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