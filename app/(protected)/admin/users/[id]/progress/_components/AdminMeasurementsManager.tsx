"use client";

import { useState, useEffect } from "react";
import { toISTDateString, formatIST, formatISTDateTime } from "@/utils/timezone";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Textarea,
} from "@nextui-org/react";
import {
  IconRulerMeasure,
  IconPlus,
  IconTrendingUp,
  IconEye,
  IconEdit,
  IconWeight,
  IconScale,
  IconActivity,
  IconHeart,
  IconUser,
  IconCheck,
  IconX
} from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import DatePicker from "@/components/UI/DatePicker";
import MeasurementHistoryModal from "@/app/(protected)/profile/_components/MeasurementHistoryModal";

interface BodyMeasurement {
  id: string;
  measurementType: string;
  value: number;
  unit: string;
  recordedDate: string;
  notes?: string;
}

interface MeasurementSummary {
  type: string;
  current: number | null;
  previous: number | null;
  change: number | null;
  unit: string;
  icon: JSX.Element;
  color: string;
}

interface AdminMeasurementsManagerProps {
  userId: string;
  userInfo: {
    username?: string;
    firstName?: string;
    email?: string;
  };
}

export default function AdminMeasurementsManager({
  userId,
  userInfo,
}: AdminMeasurementsManagerProps) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<string | null>(null);
  const [selectedMeasurementUnit, setSelectedMeasurementUnit] = useState<string>("");
  const [selectedMeasurementIcon, setSelectedMeasurementIcon] = useState<JSX.Element | null>(null);
  const [addFormValue, setAddFormValue] = useState("");
  const [addFormNotes, setAddFormNotes] = useState("");
  const [addFormDate, setAddFormDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMeasurements();
  }, [userId]);

  const fetchMeasurements = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/measurements`);
      if (response.ok) {
        const data = await response.json();
        setMeasurements(data.measurements || []);
      }
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };


  const viewHistory = (measurementType: string) => {
    setSelectedMeasurementType(measurementType);
    setIsHistoryModalOpen(true);
  };

  const startAddingMeasurement = (measurementType: string, unit: string, icon: JSX.Element) => {
    setSelectedMeasurementType(measurementType);
    setSelectedMeasurementUnit(unit);
    setSelectedMeasurementIcon(icon);
    setAddFormValue("");
    setAddFormNotes("");
    setAddFormDate(new Date());
    setIsQuickAddModalOpen(true);
  };

  const cancelAddingMeasurement = () => {
    setIsQuickAddModalOpen(false);
    setSelectedMeasurementType(null);
    setSelectedMeasurementUnit("");
    setSelectedMeasurementIcon(null);
    setAddFormValue("");
    setAddFormNotes("");
    setAddFormDate(new Date());
  };

  const saveQuickMeasurement = async () => {
    if (!addFormValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    if (!selectedMeasurementType) {
      toast.error('No measurement type selected');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/measurements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurementType: selectedMeasurementType,
          value: parseFloat(addFormValue),
          unit: selectedMeasurementUnit,
          recordedDate: toISTDateString(addFormDate),
          notes: addFormNotes.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Measurement added successfully!');
        cancelAddingMeasurement();
        fetchMeasurements();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add measurement');
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      toast.error('Failed to add measurement');
    }
  };

  // Calculate summary data for all measurement types
  const getMeasurementSummary = (): MeasurementSummary[] => {
    const summaryTypes = [
      // Basic measurements
      { type: 'METABOLIC_AGE', icon: <IconActivity size={20} className="text-secondary" />, color: 'secondary', unit: 'years' },
      { type: 'HEIGHT', icon: <IconRulerMeasure size={20} className="text-primary" />, color: 'primary', unit: 'cm' },
      { type: 'WEIGHT', icon: <IconWeight size={20} className="text-secondary" />, color: 'secondary', unit: 'kg' },

      // Body composition
      { type: 'BODY_FAT_PERCENTAGE', icon: <IconScale size={20} className="text-warning" />, color: 'warning', unit: '%' },
      { type: 'VISCERAL_FAT', icon: <IconActivity size={20} className="text-danger" />, color: 'danger', unit: 'level' },
      { type: 'SKELETAL_MUSCLE_MASS', icon: <IconWeight size={20} className="text-success" />, color: 'success', unit: 'kg' },
      { type: 'FAT_MASS', icon: <IconWeight size={20} className="text-warning" />, color: 'warning', unit: 'kg' },

      // Upper body measurements
      { type: 'NECK', icon: <IconRulerMeasure size={20} className="text-default" />, color: 'default', unit: 'inches' },
      { type: 'SHOULDERS', icon: <IconRulerMeasure size={20} className="text-secondary" />, color: 'secondary', unit: 'inches' },
      { type: 'CHEST', icon: <IconRulerMeasure size={20} className="text-primary" />, color: 'primary', unit: 'inches' },
      { type: 'UPPER_ARM_RIGHT', icon: <IconRulerMeasure size={20} className="text-success" />, color: 'success', unit: 'inches' },
      { type: 'UPPER_ARM_LEFT', icon: <IconRulerMeasure size={20} className="text-success" />, color: 'success', unit: 'inches' },
      { type: 'FOREARM_RIGHT', icon: <IconRulerMeasure size={20} className="text-primary" />, color: 'primary', unit: 'inches' },
      { type: 'FOREARM_LEFT', icon: <IconRulerMeasure size={20} className="text-primary" />, color: 'primary', unit: 'inches' },
      { type: 'WRIST', icon: <IconRulerMeasure size={20} className="text-default" />, color: 'default', unit: 'inches' },

      // Core & lower body measurements
      { type: 'WAIST', icon: <IconRulerMeasure size={20} className="text-warning" />, color: 'warning', unit: 'inches' },
      { type: 'ABDOMEN', icon: <IconRulerMeasure size={20} className="text-warning" />, color: 'warning', unit: 'inches' },
      { type: 'HIPS', icon: <IconRulerMeasure size={20} className="text-warning" />, color: 'warning', unit: 'inches' },
      { type: 'THIGH_RIGHT', icon: <IconRulerMeasure size={20} className="text-secondary" />, color: 'secondary', unit: 'inches' },
      { type: 'THIGH_LEFT', icon: <IconRulerMeasure size={20} className="text-secondary" />, color: 'secondary', unit: 'inches' },
      { type: 'CALF_RIGHT', icon: <IconRulerMeasure size={20} className="text-success" />, color: 'success', unit: 'inches' },
      { type: 'CALF_LEFT', icon: <IconRulerMeasure size={20} className="text-success" />, color: 'success', unit: 'inches' },
    ];

    return summaryTypes.map(({ type, icon, color, unit }) => {
      const typeMeasurements = measurements
        .filter(m => m.measurementType === type)
        .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());

      const current = typeMeasurements[0]?.value || null;
      const previous = typeMeasurements[1]?.value || null;
      const change = current && previous ? current - previous : null;

      return {
        type,
        current,
        previous,
        change,
        unit,
        icon,
        color
      };
    });
  };

  const measurementSummary = getMeasurementSummary();

  if (loading) {
    return (
      <Card>
        <CardHeader className="text-xl font-semibold px-5 pb-4 gap-x-3 items-center">
          <IconRulerMeasure className="text-primary" />
          Body Measurements
        </CardHeader>
        <CardBody className="px-5">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-default-200 rounded-lg"></div>
            <div className="h-20 bg-default-200 rounded-lg"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="text-xl font-semibold px-5 pb-4 gap-x-3 items-center">
          <div className="flex items-center gap-3">
            <IconRulerMeasure className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Body Measurements</h3>
              <p className="text-sm text-foreground-500">
                Manage {userInfo.firstName || userInfo.username || "user"}'s measurements
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="px-5 space-y-6">
          {/* Measurement Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {measurementSummary.map((item) => (
              <div
                key={item.type}
                className="p-3 bg-content2 rounded-lg border border-divider hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.icon}
                    <span className="text-xs font-medium leading-tight truncate">
                      {item.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="flex-shrink-0"
                      onPress={() => startAddingMeasurement(item.type, item.unit, item.icon)}
                    >
                      <IconPlus size={12} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="flex-shrink-0"
                      onPress={() => viewHistory(item.type)}
                    >
                      <IconEye size={12} />
                    </Button>
                  </div>
                </div>

                {item.current ? (
                  <div className="cursor-pointer" onClick={() => viewHistory(item.type)}>
                    <p className="text-lg font-bold">
                      {item.current} {item.unit}
                    </p>
                    {item.change !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        <IconTrendingUp
                          size={12}
                          className={item.change >= 0 ? "text-success" : "text-danger rotate-180"}
                        />
                        <span className={`text-xs ${item.change >= 0 ? "text-success" : "text-danger"}`}>
                          {item.change > 0 ? '+' : ''}{item.change.toFixed(1)} {item.unit}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-foreground-400 cursor-pointer" onClick={() => startAddingMeasurement(item.type, item.unit, item.icon)}>
                    No data recorded - Click + to add
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          {measurements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconTrendingUp size={16} className="text-foreground-500" />
                <span className="text-sm text-foreground-500">
                  {measurements.length} total measurements recorded
                </span>
              </div>
            </div>
          )}

          {measurements.length === 0 && (
            <div className="text-center py-8">
              <IconRulerMeasure size={48} className="text-foreground-300 mx-auto mb-3" />
              <p className="text-foreground-500 mb-4">No measurements recorded yet</p>
              <p className="text-sm text-foreground-400">
                Use the "+" buttons on the measurement cards above to start tracking progress
              </p>
            </div>
          )}

          <p className="text-xs text-foreground-400 leading-relaxed">
            Track body measurements over time to monitor fitness progress.
            Data is securely stored and only accessible by authorized administrators.
          </p>
        </CardBody>
      </Card>


      {/* Measurement History Modal */}
      <BottomSheet
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={selectedMeasurementType ?
          `${selectedMeasurementType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} History`
          : 'Measurement History'
        }
        size="3xl"
      >
        {selectedMeasurementType && (
          <MeasurementHistoryModal
            measurementType={selectedMeasurementType}
            measurements={measurements.filter(m => m.measurementType === selectedMeasurementType)}
            onClose={() => setIsHistoryModalOpen(false)}
          />
        )}
      </BottomSheet>

      {/* Quick Add Measurement Modal */}
      <BottomSheet
        isOpen={isQuickAddModalOpen}
        onClose={cancelAddingMeasurement}
        title={selectedMeasurementType ?
          `Add ${selectedMeasurementType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`
          : 'Add Measurement'
        }
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="light"
              onPress={cancelAddingMeasurement}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={saveQuickMeasurement}
              className="flex-1"
              startContent={<IconCheck size={16} />}
            >
              Save Measurement
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Measurement Type Header */}
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
            {selectedMeasurementIcon}
            <div>
              <h4 className="font-medium text-foreground">
                {selectedMeasurementType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-sm text-foreground-500">
                Enter measurement for {userInfo.firstName || userInfo.username || userInfo.email || 'user'} in {selectedMeasurementUnit}
              </p>
            </div>
          </div>

          {/* Value Input */}
          <Input
            label="Measurement Value"
            type="number"
            placeholder="Enter value"
            value={addFormValue}
            onChange={(e) => setAddFormValue(e.target.value)}
            endContent={<span className="text-sm text-foreground-500">{selectedMeasurementUnit}</span>}
            size="lg"
            isRequired
          />

          {/* Date Picker */}
          <DatePicker
            label="Measurement Date"
            value={addFormDate}
            onChange={(date) => setAddFormDate(date || new Date())}
            size="lg"
            placeholder="Select date"
          />

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            placeholder="Add any notes about this measurement..."
            value={addFormNotes}
            onChange={(e) => setAddFormNotes(e.target.value)}
            rows={3}
            size="lg"
          />
        </div>
      </BottomSheet>
    </>
  );
}