"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress
} from "@nextui-org/react";
import {
  IconHeart,
  IconFlame,
  IconRun,
  IconActivity
} from "@tabler/icons-react";

interface FitnessData {
  steps?: {
    today: number;
    target: number;
    source: 'GOOGLE_FIT' | 'MANUAL';
  };
  heartRate?: {
    average: number;
    max: number;
    min: number;
    date: string;
  };
  calories?: {
    burned: number;
    date: string;
  };
  distance?: {
    meters: number;
    date: string;
  };
}

export default function FitnessDataCards() {
  const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFitnessData();
  }, []);

  const fetchFitnessData = async () => {
    try {
      const response = await fetch('/api/fitness/dashboard');
      if (response.ok) {
        const data = await response.json();
        setFitnessData(data);
      }
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} shadow="none" className="shadow-md animate-pulse">
            <CardBody className="p-4 h-24">
              <div className="bg-default-200 rounded h-4 w-3/4 mb-2"></div>
              <div className="bg-default-100 rounded h-6 w-1/2"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Heart Rate Card */}
      {fitnessData?.heartRate && (
        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-3 text-xs uppercase flex gap-2 items-center">
            <IconHeart size={18} className="text-danger" />
            Heart Rate
          </CardHeader>
          <CardBody className="px-3 pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {fitnessData.heartRate.average} bpm
              </div>
              <div className="text-xs text-foreground-500 space-y-1">
                <div>Max: {fitnessData.heartRate.max} bpm</div>
                <div>Min: {fitnessData.heartRate.min} bpm</div>
              </div>
              <Chip size="sm" color="success" variant="flat">
                Google Fit
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Calories Card */}
      {fitnessData?.calories && (
        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-3 text-xs uppercase flex gap-2 items-center">
            <IconFlame size={18} className="text-warning" />
            Calories
          </CardHeader>
          <CardBody className="px-3 pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {fitnessData.calories.burned.toLocaleString()}
              </div>
              <div className="text-xs text-foreground-500">
                Burned today
              </div>
              <Chip size="sm" color="success" variant="flat">
                Google Fit
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Distance Card */}
      {fitnessData?.distance && (
        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-3 text-xs uppercase flex gap-2 items-center">
            <IconRun size={18} className="text-primary" />
            Distance
          </CardHeader>
          <CardBody className="px-3 pt-0">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                {(fitnessData.distance.meters / 1000).toFixed(1)} km
              </div>
              <div className="text-xs text-foreground-500">
                {fitnessData.distance.meters.toLocaleString()} meters
              </div>
              <Chip size="sm" color="success" variant="flat">
                Google Fit
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Activity Summary Card */}
      {(fitnessData?.steps || fitnessData?.heartRate || fitnessData?.calories) && (
        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-3 text-xs uppercase flex gap-2 items-center">
            <IconActivity size={18} className="text-success" />
            Today's Summary
          </CardHeader>
          <CardBody className="px-3 pt-0">
            <div className="space-y-2">
              {fitnessData.steps && (
                <div className="flex justify-between">
                  <span className="text-xs text-foreground-500">Steps:</span>
                  <span className="text-sm font-medium">
                    {fitnessData.steps.today.toLocaleString()}
                  </span>
                </div>
              )}
              {fitnessData.heartRate && (
                <div className="flex justify-between">
                  <span className="text-xs text-foreground-500">Avg HR:</span>
                  <span className="text-sm font-medium">
                    {fitnessData.heartRate.average} bpm
                  </span>
                </div>
              )}
              {fitnessData.calories && (
                <div className="flex justify-between">
                  <span className="text-xs text-foreground-500">Calories:</span>
                  <span className="text-sm font-medium">
                    {fitnessData.calories.burned}
                  </span>
                </div>
              )}
              {fitnessData.distance && (
                <div className="flex justify-between">
                  <span className="text-xs text-foreground-500">Distance:</span>
                  <span className="text-sm font-medium">
                    {(fitnessData.distance.meters / 1000).toFixed(1)} km
                  </span>
                </div>
              )}
              <Chip size="sm" color="success" variant="flat" className="w-full justify-center">
                All data from Google Fit
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}