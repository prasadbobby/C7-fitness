"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { handleCreateRoutineStepOne } from "@/server-actions/RoutineServerActions";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import {
  IconPlayerTrackNextFilled,
  IconClipboardList,
  IconTarget,
  IconNotes,
  IconSparkles
} from "@tabler/icons-react";

export default function NewRoutineFormStepOneClient({
  routineId,
  routineName,
  routineNotes,
  pageTitle,
}: {
  routineId: string | null;
  routineName: string;
  routineNotes: string;
  pageTitle: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    if (routineId) {
      formData.append("routineId", routineId);
    }
    const response = await handleCreateRoutineStepOne(formData, routineId);
    if (response.success) {
      router.push(`/edit-routine/step-2?id=${response.newRoutineId}`);
    } else {
      toast.error(response.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <IconClipboardList size={48} className="text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{pageTitle}</h1>
          <p className="text-foreground-500 max-w-lg mx-auto">
            Start your fitness journey by creating a personalized workout routine.
            Let&apos;s begin with the basic information.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">1</span>
          </div>
          <span className="text-primary font-medium">Basic Info</span>
        </div>
        <div className="w-12 h-0.5 bg-default-300"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-default-300 rounded-full flex items-center justify-center">
            <span className="text-default-500 text-sm font-bold">2</span>
          </div>
          <span className="text-default-500">Add Exercises</span>
        </div>
        <div className="w-12 h-0.5 bg-default-300"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-default-300 rounded-full flex items-center justify-center">
            <span className="text-default-500 text-sm font-bold">3</span>
          </div>
          <span className="text-default-500">Review</span>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-lg bg-content1 border-none" shadow="none">
        <CardBody className="p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Routine Name Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <IconTarget size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Routine Name</h3>
              </div>
              <Input
                name="routineName"
                placeholder="My Workout Plan"
                label="Routine Name"
                isRequired
                defaultValue={routineName}
                size="lg"
                variant="flat"
                classNames={{
                  input: "text-base",
                  inputWrapper: "h-12",
                  label: "text-foreground-600 font-medium"
                }}
              />
            </div>

            <Divider className="my-6" />

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <IconNotes size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Notes</h3>
              </div>
              <Textarea
                name="routineNotes"
                placeholder="Optional notes about your routine..."
                label="Notes"
                defaultValue={routineNotes}
                minRows={4}
                variant="flat"
                classNames={{
                  input: "text-base",
                  label: "text-foreground-600 font-medium"
                }}
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-6">
              <Button
                isDisabled={isSaving}
                color="primary"
                size="lg"
                type="submit"
                className="px-8 py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                isLoading={isSaving}
                spinner={<IconSparkles size={18} className="animate-spin" />}
              >
                {isSaving ? "Creating Routine..." : "Continue to Add Exercises"}
                {!isSaving && <IconPlayerTrackNextFilled size={20} />}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
