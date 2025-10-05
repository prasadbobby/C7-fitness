"use client";

import { useState } from "react";
import { Select, SelectItem, Button, Chip } from "@nextui-org/react";
import { IconFilter, IconFilterX } from "@tabler/icons-react";

const trainingCategories = [
  { key: "ENDURANCE", label: "Endurance" },
  { key: "HYPERTROPHY", label: "Hypertrophy" },
  { key: "STRENGTH", label: "Strength" },
  { key: "POWER", label: "Power" },
  { key: "TONING", label: "Toning" },
  { key: "FUNCTIONAL", label: "Functional" },
];

type RoutineFilterProps = {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  routineCount: number;
  totalCount: number;
};

export default function RoutineFilter({
  selectedCategory,
  onCategoryChange,
  routineCount,
  totalCount,
}: RoutineFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1">
        <Select
          placeholder="Filter by training category"
          selectedKeys={selectedCategory ? [selectedCategory] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            onCategoryChange(selectedKey || "");
          }}
          size="sm"
          variant="flat"
          startContent={<IconFilter size={16} />}
          className="max-w-xs"
        >
          {trainingCategories.map((category) => (
            <SelectItem key={category.key} value={category.key}>
              {category.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {selectedCategory && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => onCategoryChange("")}
            startContent={<IconFilterX size={16} />}
          >
            Clear Filter
          </Button>
        )}

        <div className="text-sm text-foreground-500">
          {selectedCategory ? (
            <>
              Showing {routineCount} of {totalCount} routines
              {routineCount < totalCount && (
                <Chip size="sm" variant="flat" color="primary" className="ml-2">
                  {totalCount - routineCount} hidden
                </Chip>
              )}
            </>
          ) : (
            `${totalCount} routines`
          )}
        </div>
      </div>
    </div>
  );
}