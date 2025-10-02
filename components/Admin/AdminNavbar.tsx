"use client";

import { UserButton } from "@clerk/nextjs";
import { Chip } from "@nextui-org/react";
import { IconShield } from "@tabler/icons-react";

export default function AdminNavbar() {
  return (
    <nav className="bg-content1 border-b border-divider px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Chip
            startContent={<IconShield size={16} />}
            color="warning"
            variant="flat"
            size="sm"
          >
            Admin Mode
          </Chip>
        </div>

        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}