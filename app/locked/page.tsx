"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button, Card, CardBody } from "@nextui-org/react";
import { IconAlertTriangle, IconHome, IconMail } from "@tabler/icons-react";
import Link from "next/link";

export default function LockedPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    // Automatically sign out the locked user
    const timer = setTimeout(() => {
      signOut({
        redirectUrl: '/locked'
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardBody className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4">
              <IconAlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Account Locked
            </h1>
            <p className="text-foreground-600">
              Your account has been locked by the administrator and cannot be accessed.
            </p>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-danger mb-2">Important:</h3>
            <ul className="text-sm text-foreground-600 text-left space-y-1">
              <li>• Your account is permanently locked until unlocked by an admin</li>
              <li>• You cannot access your account or any app features</li>
              <li>• Your data is safely preserved</li>
              <li>• Only an administrator can restore your access</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-foreground-500 mb-4">
              If you believe this is a mistake or need your account unlocked,
              please contact the administrator immediately.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                as={Link}
                href="/"
                variant="ghost"
                startContent={<IconHome size={18} />}
                className="flex-1"
              >
                Go Home
              </Button>

              <Button
                as={Link}
                href="mailto:support@c7personalfitness.com"
                color="primary"
                startContent={<IconMail size={18} />}
                className="flex-1"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}