"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Select,
  SelectItem,
  Input,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";
import {
  IconPlus,
  IconEdit,
  IconCheck,
  IconX,
  IconTarget,
  IconCalendar,
} from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";

const trainingCategories = [
  {
    key: "ENDURANCE",
    label: "Endurance Training",
    description: "15-20 reps, 40-50% 1RM, 30-60s rest",
    color: "secondary" as const,
  },
  {
    key: "HYPERTROPHY",
    label: "Hypertrophy Training",
    description: "8-12 reps, 70-80% 1RM, 60-90s rest",
    color: "success" as const,
  },
  {
    key: "STRENGTH",
    label: "Strength Training",
    description: "3-6 reps, 85-95% 1RM, 2-5min rest",
    color: "danger" as const,
  },
  {
    key: "POWER",
    label: "Power Training",
    description: "1-3 reps, 90-100% 1RM, 3-5min rest",
    color: "warning" as const,
  },
  {
    key: "TONING",
    label: "Toning Training",
    description: "12-15 reps, 60-70% 1RM, 45-75s rest",
    color: "primary" as const,
  },
  {
    key: "FUNCTIONAL",
    label: "Functional Training",
    description: "Variable reps, bodyweight focus, 30-90s rest",
    color: "default" as const,
  },
];

interface TrainingProgression {
  id: string;
  userId: string;
  trainingType: string;
  startDate: string;
  endDate?: string;
  targetWeeks: number;
  actualWeeks?: number;
  isActive: boolean;
  isCompleted: boolean;
  assignedBy: string;
  notes?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrainingCategoryManagerProps {
  userId: string;
  userInfo: {
    username?: string;
    firstName?: string;
    email?: string;
  };
}

export default function TrainingCategoryManager({
  userId,
  userInfo,
}: TrainingCategoryManagerProps) {
  const [progressions, setProgressions] = useState<TrainingProgression[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [targetWeeks, setTargetWeeks] = useState("4");
  const [notes, setNotes] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const activeProgression = progressions.find(p => p.isActive);
  const displayName = userInfo.username || userInfo.firstName || userInfo.email || "User";

  useEffect(() => {
    fetchProgressions();
  }, [userId]);

  const fetchProgressions = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/training-progressions`);
      if (response.ok) {
        const data = await response.json();
        setProgressions(data.progressions || []);
      }
    } catch (error) {
      console.error("Error fetching progressions:", error);
    }
  };

  const handleAssignCategory = async () => {
    if (!selectedCategory) {
      toast.error("Please select a training category");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/training-progressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          trainingType: selectedCategory,
          targetWeeks: parseInt(targetWeeks),
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Training category assigned successfully!");
        await fetchProgressions();
        setSelectedCategory("");
        setTargetWeeks("4");
        setNotes("");
        onClose();
      } else {
        if (response.status === 409) {
          toast.error(`User already has an active ${data.existingProgression} training progression`);
        } else {
          toast.error(data.error || "Failed to assign training category");
        }
      }
    } catch (error) {
      toast.error("Failed to assign training category");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProgression = async (progressionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/training-progressions/${progressionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCompleted: true,
          isActive: false,
          endDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Training progression completed!");
        await fetchProgressions();
      } else {
        toast.error("Failed to complete progression");
      }
    } catch (error) {
      toast.error("Failed to complete progression");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (trainingType: string) => {
    return trainingCategories.find(cat => cat.key === trainingType);
  };

  const getWeeksElapsed = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <IconTarget size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Training Category</h3>
        </div>
        {!activeProgression && (
          <Button
            color="primary"
            size="sm"
            startContent={<IconPlus size={16} />}
            onPress={onOpen}
          >
            Assign Category
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {activeProgression ? (
          <div className="space-y-4">
            {/* Active Training Category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Chip
                  variant="flat"
                  color={getCategoryInfo(activeProgression.trainingType)?.color || "default"}
                  size="lg"
                >
                  {getCategoryInfo(activeProgression.trainingType)?.label || activeProgression.trainingType}
                </Chip>
                <div className="text-sm text-foreground-500">
                  Week {getWeeksElapsed(activeProgression.startDate) + 1} of {activeProgression.targetWeeks}
                </div>
              </div>
              <Button
                color="success"
                variant="flat"
                size="sm"
                startContent={<IconCheck size={16} />}
                onPress={() => handleCompleteProgression(activeProgression.id)}
                isLoading={loading}
              >
                Complete Phase
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.min(getWeeksElapsed(activeProgression.startDate) + 1, activeProgression.targetWeeks)}/{activeProgression.targetWeeks} weeks</span>
              </div>
              <div className="w-full bg-default-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((getWeeksElapsed(activeProgression.startDate) + 1) / activeProgression.targetWeeks * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Category Description */}
            <div className="p-3 bg-default-50 rounded-lg">
              <p className="text-sm font-medium">
                {getCategoryInfo(activeProgression.trainingType)?.description}
              </p>
            </div>

            {/* Notes */}
            {activeProgression.notes && (
              <div className="p-3 bg-default-100 rounded-lg">
                <p className="text-sm">
                  <strong>Notes:</strong> {activeProgression.notes}
                </p>
              </div>
            )}

            {/* Training History */}
            {progressions.filter(p => !p.isActive).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Previous Training Phases</h4>
                <div className="space-y-2">
                  {progressions
                    .filter(p => !p.isActive)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
                    .map((progression) => (
                      <div key={progression.id} className="flex items-center justify-between p-2 bg-default-50 rounded">
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getCategoryInfo(progression.trainingType)?.color || "default"}
                          >
                            {getCategoryInfo(progression.trainingType)?.label || progression.trainingType}
                          </Chip>
                          <span className="text-xs text-foreground-500">
                            {new Date(progression.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Chip size="sm" color={progression.isCompleted ? "success" : "warning"} variant="flat">
                          {progression.isCompleted ? "Completed" : "Incomplete"}
                        </Chip>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <IconTarget className="w-12 h-12 text-default-400 mx-auto mb-3" />
            <p className="text-foreground-500 mb-4">
              No training category assigned to {displayName}
            </p>
            <Button
              color="primary"
              startContent={<IconPlus size={16} />}
              onPress={onOpen}
            >
              Assign Training Category
            </Button>
          </div>
        )}
      </CardBody>

      {/* Assignment Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={`Assign Training Category to ${displayName}`}
        footer={
          <>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignCategory}
              isLoading={loading}
            >
              Assign Category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Training Category"
            placeholder="Select a training category"
            selectedKeys={selectedCategory ? [selectedCategory] : []}
            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
            isRequired
          >
            {trainingCategories.map((category) => (
              <SelectItem key={category.key} textValue={category.label}>
                <div className="flex flex-col">
                  <span className="font-medium">{category.label}</span>
                  <span className="text-xs text-foreground-500">{category.description}</span>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Input
            type="number"
            label="Target Duration (weeks)"
            placeholder="4"
            value={targetWeeks}
            onValueChange={setTargetWeeks}
            min="1"
            max="52"
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Any specific goals or notes for this training phase..."
            value={notes}
            onValueChange={setNotes}
            minRows={3}
          />
        </div>
      </BottomSheet>
    </Card>
  );
}