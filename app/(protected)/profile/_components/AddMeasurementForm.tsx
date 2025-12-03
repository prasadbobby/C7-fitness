"use client";

import { useState } from "react";
import { toast } from "sonner";
import { toISTDateString } from "@/utils/timezone";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Textarea } from "@nextui-org/input";
import { Card, CardBody } from "@nextui-org/card";
import DatePicker from "@/components/UI/DatePicker";
import {
  IconWeight,
  IconRulerMeasure,
  IconScale,
  IconDeviceFloppy,
  IconX,
  IconActivity,
  IconHeart,
  IconUser
} from "@tabler/icons-react";

interface AddMeasurementFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  adminUserId?: string; // If provided, this is an admin adding measurements for another user
}

const measurementTypes = [
  // Basic Metrics
  { key: "METABOLIC_AGE", label: "Metabolic Age", unit: "years", icon: <IconActivity size={16} />, category: "basic" },
  { key: "HEIGHT", label: "Height", unit: "cm", icon: <IconRulerMeasure size={16} />, category: "basic" },
  { key: "WEIGHT", label: "Weight", unit: "kg", icon: <IconWeight size={16} />, category: "basic" },

  // Body Composition
  { key: "BODY_FAT_PERCENTAGE", label: "Body Fat %", unit: "%", icon: <IconScale size={16} />, category: "composition" },
  { key: "VISCERAL_FAT", label: "V Fat", unit: "level", icon: <IconActivity size={16} />, category: "composition" },
  { key: "SKELETAL_MUSCLE_MASS", label: "Skeletal Muscle Mass", unit: "kg", icon: <IconWeight size={16} />, category: "composition" },
  { key: "FAT_MASS", label: "Body Fat Mass", unit: "kg", icon: <IconWeight size={16} />, category: "composition" },

  // Upper Body Measurements
  { key: "NECK", label: "Neck", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "SHOULDERS", label: "Shoulders", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "CHEST", label: "Chest", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "UPPER_ARM_RIGHT", label: "Upper Arm (Right)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "UPPER_ARM_LEFT", label: "Upper Arm (Left)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "FOREARM_RIGHT", label: "Forearm (Right)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "FOREARM_LEFT", label: "Forearm (Left)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },
  { key: "WRIST", label: "Wrist", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "upper" },

  // Core & Lower Body Measurements
  { key: "WAIST", label: "Waist", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "core" },
  { key: "ABDOMEN", label: "Abdomen", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "core" },
  { key: "HIPS", label: "Hip", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "core" },
  { key: "THIGH_RIGHT", label: "Thigh (Right)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "lower" },
  { key: "THIGH_LEFT", label: "Thigh (Left)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "lower" },
  { key: "CALF_RIGHT", label: "Calf (Right)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "lower" },
  { key: "CALF_LEFT", label: "Calf (Left)", unit: "inches", icon: <IconRulerMeasure size={16} />, category: "lower" },
];

export default function AddMeasurementForm({ onSuccess, onCancel, adminUserId }: AddMeasurementFormProps) {
  const [formData, setFormData] = useState({
    measurementType: "",
    value: "",
    notes: "",
    recordedDate: new Date(), // Today's date as Date object
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedType = measurementTypes.find(t => t.key === formData.measurementType);

    if (!formData.measurementType || !formData.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        measurementType: formData.measurementType,
        value: parseFloat(formData.value),
        unit: selectedType?.unit || 'unit',
        recordedDate: toISTDateString(formData.recordedDate),
        notes: formData.notes || null,
      };

      // Use admin API if adminUserId is provided, otherwise use regular user API
      const apiEndpoint = adminUserId
        ? `/api/admin/users/${adminUserId}/measurements`
        : '/api/measurements';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          measurementType: "",
          value: "",
          notes: "",
          recordedDate: new Date(),
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add measurement');
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      toast.error('Failed to add measurement');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = measurementTypes.find(t => t.key === formData.measurementType);

  // Group measurements by category
  const measurementsByCategory = measurementTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof measurementTypes>);

  const categoryLabels = {
    basic: "Basic Metrics",
    composition: "Body Composition",
    upper: "Upper Body",
    core: "Core & Hips",
    lower: "Lower Body"
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Measurement Type Selection by Category */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground-600">Select Measurement Type</h3>

        {Object.entries(measurementsByCategory).map(([category, types]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-foreground-500 uppercase tracking-wide">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {types.map((type) => (
                <Card
                  key={type.key}
                  isPressable
                  className={`cursor-pointer transition-all ${
                    formData.measurementType === type.key
                      ? 'ring-2 ring-primary bg-primary/10 border-primary/20'
                      : 'hover:bg-content2 border-divider'
                  }`}
                  onPress={() => setFormData(prev => ({
                    ...prev,
                    measurementType: type.key,
                    // Reset value when changing type
                    value: ""
                  }))}
                >
                  <CardBody className="p-3">
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-foreground-500">({type.unit})</p>
                      </div>
                      {formData.measurementType === type.key && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Value Input */}
      {selectedType && (
        <Input
          type="number"
          label="Value"
          placeholder={`Enter ${selectedType?.label?.toLowerCase()} value`}
          value={formData.value}
          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
          endContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">{selectedType.unit}</span>
            </div>
          }
          isRequired
        />
      )}

      {/* Date Input */}
      <DatePicker
        label="Measurement Date"
        value={formData.recordedDate}
        onChange={(date) => setFormData(prev => ({ ...prev, recordedDate: date || new Date() }))}
        isRequired
        placeholder="Select measurement date"
      />

      {/* Notes */}
      <Textarea
        label="Notes (Optional)"
        placeholder="Add any notes about this measurement..."
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        minRows={2}
        maxRows={4}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="light"
          onPress={onCancel}
          startContent={<IconX size={16} />}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          startContent={!loading && <IconDeviceFloppy size={16} />}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Save Measurement'}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-foreground-400 text-center leading-relaxed">
        Record your measurements regularly to track your fitness progress over time.
        Consistency in timing and conditions will give you the most accurate trends.
      </p>
    </form>
  );
}