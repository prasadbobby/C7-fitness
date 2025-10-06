"use client";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { CheckboxGroup, Checkbox } from "@nextui-org/checkbox";
import { IconBarbell } from "@tabler/icons-react";

interface ProfileEquipmentProps {
  equipment: string[];
}

const equipmentItems = [
  "body_only",
  "foam_roll",
  "kettlebells",
  "dumbbell",
  "cable",
  "barbell",
  "bands",
  "medicine_ball",
  "exercise_ball",
  "e_z_curl_bar",
];

const formatText = (text: string): string => {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ProfileEquipment({ equipment }: ProfileEquipmentProps) {

  return (
    <Card shadow="none" className="shadow-md">
      <CardHeader className="text-xl font-semibold px-5 pb-0 gap-x-3 items-center">
        <IconBarbell className="text-danger" />
        Equipment Preferences
      </CardHeader>
      <CardBody className="px-5">
        <CheckboxGroup
          value={equipment}
          color="primary"
          isReadOnly
        >
          {equipmentItems.map((item, index) => (
            <Checkbox key={index} value={item} isDisabled>
              {formatText(item)}
            </Checkbox>
          ))}
        </CheckboxGroup>
        {equipment.length === 0 && (
          <p className="text-sm text-foreground-500 mt-2">
            No equipment preferences set. Contact admin to update your preferences.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
