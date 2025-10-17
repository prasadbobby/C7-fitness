"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Chip } from "@nextui-org/chip";
import { Progress } from "@nextui-org/progress";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconNotes,
  IconChartLine,
  IconList,
  IconMinus
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { Slider } from "@nextui-org/slider";

interface BodyMeasurement {
  id: string;
  measurementType: string;
  value: number;
  unit: string;
  recordedDate: string;
  notes?: string;
}

interface MeasurementHistoryModalProps {
  measurementType: string;
  measurements: BodyMeasurement[];
  onClose: () => void;
}

export default function MeasurementHistoryModal({
  measurementType,
  measurements,
  onClose
}: MeasurementHistoryModalProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [dateRange, setDateRange] = useState<number>(30); // Default to 1M

  // Date range mapping
  const dateRangeMap: { [key: number]: { label: string; days: number } } = {
    10: { label: "3D", days: 3 },
    20: { label: "1W", days: 7 },
    30: { label: "1M", days: 30 },
    40: { label: "3M", days: 90 },
    50: { label: "1Y", days: 365 },
  };

  // Filter measurements by date range
  const filteredMeasurements = [...measurements].filter(measurement => {
    const measurementDate = new Date(measurement.recordedDate);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeMap[dateRange].days);
    return measurementDate >= cutoffDate;
  });

  // Sort measurements by date (most recent first)
  const sortedMeasurements = filteredMeasurements.sort(
    (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
  );

  // Calculate statistics
  const calculateStats = () => {
    if (sortedMeasurements.length === 0) return null;

    const values = sortedMeasurements.map(m => m.value);
    const current = values[0];
    const previous = values[1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    const change = previous ? current - previous : 0;
    const changePercentage = previous ? ((change / previous) * 100) : 0;
    const totalChange = values.length > 1 ? current - values[values.length - 1] : 0;
    const totalChangePercentage = values.length > 1 ?
      ((totalChange / values[values.length - 1]) * 100) : 0;

    return {
      current,
      previous,
      change,
      changePercentage,
      totalChange,
      totalChangePercentage,
      min,
      max,
      avg,
      count: values.length
    };
  };

  const stats = calculateStats();
  const unit = sortedMeasurements[0]?.unit || '';

  // Group measurements by month for chart visualization
  const getChartData = () => {
    if (sortedMeasurements.length === 0) {
      return [];
    }

    // For fewer than 3 measurements, use individual data points
    if (sortedMeasurements.length < 3) {
      return sortedMeasurements.map(measurement => ({
        period: new Date(measurement.recordedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        value: parseFloat(measurement.value.toFixed(1)),
        count: 1
      })).reverse(); // Reverse to show chronological order
    }

    // For 3+ measurements, group by month
    const monthlyGroups: { [key: string]: BodyMeasurement[] } = {};

    sortedMeasurements.forEach(measurement => {
      const date = new Date(measurement.recordedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(measurement);
    });

    // Get average for each month
    return Object.entries(monthlyGroups)
      .map(([monthKey, measurements]) => {
        const avgValue = measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length;
        const [year, month] = monthKey.split('-');
        return {
          monthKey,
          period: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          value: parseFloat(avgValue.toFixed(1)),
          count: measurements.length
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  };

  const chartData = getChartData();

  // Custom tooltip for the chart - matches dashboard style
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 text-white px-4 py-2 rounded-xl shadow-xl text-xs">
          <p className="font-semibold">
            {formatMeasurementType(measurementType)}: <span className="text-primary">{payload[0].value}</span> {unit}
          </p>
          <p>Period: {label}</p>
        </div>
      );
    }
    return null;
  };

  // Recharts implementation
  const renderChart = () => {
    console.log('Chart data for', measurementType, ':', chartData);
    console.log('Number of data points:', chartData.length);

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-content1 rounded-lg">
          <div className="text-center">
            <IconChartLine size={48} className="text-foreground-300 mx-auto mb-3" />
            <p className="text-foreground-500">No data to display</p>
          </div>
        </div>
      );
    }

    // Simple chart like dashboard - no complex Y-axis calculations needed

    return (
      <div className="space-y-4">
        <div className="h-48 bg-content1 rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Line type="monotone" dataKey="value" stroke="#000000" />
              <XAxis dataKey="period" tick={{ fontSize: "10px" }} />
              <YAxis tick={{ fontSize: "10px" }} />
              <Tooltip content={<CustomTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-foreground-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black rounded-sm"></div>
            <span>Progress Tracking ({chartData.length} data points)</span>
          </div>
        </div>
      </div>
    );
  };

  const formatMeasurementType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!stats) {
    return (
      <div className="text-center py-8">
        <IconChartLine size={48} className="text-foreground-300 mx-auto mb-3" />
        <p className="text-foreground-500">No measurements recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Current Value */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">{formatMeasurementType(measurementType)} History</h2>
        <div className="space-y-1">
          <p className="text-sm text-foreground-500">Current</p>
          <p className="text-4xl font-bold text-primary">{stats.current.toFixed(1)} {unit}</p>
          {stats.change !== 0 && (
            <div className="flex items-center justify-center gap-1">
              {stats.change > 0 ? (
                <IconTrendingUp size={16} className="text-success" />
              ) : (
                <IconTrendingDown size={16} className="text-danger" />
              )}
              <span className={`text-sm font-medium ${stats.change > 0 ? 'text-success' : 'text-danger'}`}>
                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total Change Card */}
      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
        <CardBody className="p-4">
          <div className="text-center">
            <p className="text-xs text-secondary-600 font-semibold uppercase mb-1">Total Change</p>
            <p className="text-2xl font-bold text-secondary">
              {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} {unit}
            </p>
            <p className="text-sm text-secondary-600 mt-1">
              {stats.totalChangePercentage > 0 ? '+' : ''}{stats.totalChangePercentage.toFixed(1)}%
            </p>
          </div>
        </CardBody>
      </Card>

      {/* View Toggle and Date Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'chart' ? 'solid' : 'light'}
            color="primary"
            startContent={<IconChartLine size={16} />}
            onPress={() => setViewMode('chart')}
          >
            Chart
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'solid' : 'light'}
            color="primary"
            startContent={<IconList size={16} />}
            onPress={() => setViewMode('list')}
          >
            List
          </Button>
        </div>

        {/* Date Range Slider */}
        {viewMode === 'chart' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground-500">Range:</span>
            <Slider
              aria-label="Date Range Slider"
              onChange={(value) => {
                if (typeof value === "number") {
                  setDateRange(value);
                }
              }}
              size="sm"
              step={10}
              color="primary"
              showSteps={true}
              defaultValue={30}
              maxValue={50}
              minValue={10}
              className="w-36"
              classNames={{ mark: "text-xs text-foreground-400" }}
              marks={[
                { value: 10, label: "3D" },
                { value: 20, label: "1W" },
                { value: 30, label: "1M" },
                { value: 40, label: "3M" },
                { value: 50, label: "1Y" },
              ]}
            />
          </div>
        )}
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div>
          <h3 className="text-sm font-medium mb-3">Progress Over Time</h3>
          {renderChart()}

          {/* Additional Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-content2 rounded-lg">
              <p className="text-xs text-foreground-500">Average</p>
              <p className="text-sm font-semibold">{stats.avg.toFixed(1)} {unit}</p>
            </div>
            <div className="text-center p-3 bg-content2 rounded-lg">
              <p className="text-xs text-foreground-500">Highest</p>
              <p className="text-sm font-semibold">{stats.max.toFixed(1)} {unit}</p>
            </div>
            <div className="text-center p-3 bg-content2 rounded-lg">
              <p className="text-xs text-foreground-500">Lowest</p>
              <p className="text-sm font-semibold">{stats.min.toFixed(1)} {unit}</p>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Measurement History ({stats.count} records)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedMeasurements.map((measurement, index) => (
              <Card key={measurement.id}>
                <CardBody className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold">{measurement.value} {unit}</p>
                        <p className="text-xs text-foreground-500">
                          {new Date(measurement.recordedDate).toLocaleDateString()}
                        </p>
                      </div>

                      {index < sortedMeasurements.length - 1 && (
                        <div className="flex items-center gap-1">
                          {measurement.value > sortedMeasurements[index + 1].value ? (
                            <IconTrendingUp size={14} className="text-success" />
                          ) : measurement.value < sortedMeasurements[index + 1].value ? (
                            <IconTrendingDown size={14} className="text-danger" />
                          ) : (
                            <IconMinus size={14} className="text-foreground-400" />
                          )}
                          <span className={`text-xs ${
                            measurement.value > sortedMeasurements[index + 1].value ? 'text-success' :
                            measurement.value < sortedMeasurements[index + 1].value ? 'text-danger' :
                            'text-foreground-400'
                          }`}>
                            {measurement.value > sortedMeasurements[index + 1].value ? '+' : ''}
                            {(measurement.value - sortedMeasurements[index + 1].value).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {measurement.notes && (
                      <div className="flex items-center gap-1 text-foreground-400">
                        <IconNotes size={14} />
                        <span className="text-xs">{measurement.notes.substring(0, 20)}...</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-xs text-foreground-400 text-center space-y-1">
        <p>Tracking {formatMeasurementType(measurementType)} progress</p>
        <p>Record measurements regularly for better trend analysis</p>
      </div>
    </div>
  );
}