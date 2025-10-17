"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
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
  IconUser
} from "@tabler/icons-react";
import { toast } from "sonner";
import BottomSheet from "@/components/UI/BottomSheet";
import AddMeasurementForm from "@/app/(protected)/profile/_components/AddMeasurementForm";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<string | null>(null);

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

  const handleMeasurementAdded = () => {
    fetchMeasurements();
    setIsAddModalOpen(false);
    toast.success('Measurement added successfully!');
  };

  const viewHistory = (measurementType: string) => {
    setSelectedMeasurementType(measurementType);
    setIsHistoryModalOpen(true);
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
        <CardHeader className="text-xl font-semibold px-5 pb-4 gap-x-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <IconRulerMeasure className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Body Measurements</h3>
              <p className="text-sm text-foreground-500">
                Manage {userInfo.firstName || userInfo.username || "user"}'s measurements
              </p>
            </div>
          </div>
          <Button
            color="primary"
            size="sm"
            variant="flat"
            startContent={<IconPlus size={16} />}
            onPress={() => setIsAddModalOpen(true)}
          >
            Add
          </Button>
        </CardHeader>

        <CardBody className="px-5 space-y-6">
          {/* Measurement Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {measurementSummary.map((item) => (
              <div
                key={item.type}
                className="p-3 bg-content2 rounded-lg border border-divider hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewHistory(item.type)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs font-medium">
                      {item.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => viewHistory(item.type)}
                  >
                    <IconEye size={14} />
                  </Button>
                </div>

                {item.current ? (
                  <div>
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
                  <div className="text-xs text-foreground-400">
                    No data recorded
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
              <Button
                color="primary"
                variant="flat"
                startContent={<IconPlus size={16} />}
                onPress={() => setIsAddModalOpen(true)}
              >
                Add First Measurement
              </Button>
            </div>
          )}

          <p className="text-xs text-foreground-400 leading-relaxed">
            Track body measurements over time to monitor fitness progress.
            Data is securely stored and only accessible by authorized administrators.
          </p>
        </CardBody>
      </Card>

      {/* Add Measurement Modal */}
      <BottomSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Measurement for ${userInfo.firstName || userInfo.username || "User"}`}
        size="2xl"
      >
        <AddMeasurementForm
          onSuccess={handleMeasurementAdded}
          onCancel={() => setIsAddModalOpen(false)}
          adminUserId={userId}
        />
      </BottomSheet>

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
    </>
  );
}