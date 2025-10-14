"use client";

import Link from "next/link";
import { IconFlame, IconMail, IconBrandInstagram, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <IconFlame className="text-primary" size={32} />
              <div className="flex flex-col">
                <h4 className="text-2xl font-bold leading-tight tracking-tight" style={{ color: '#a6ff00' }}>C7</h4>
                <p className="text-xs text-foreground-500 leading-tight">Personal Fitness Studio</p>
              </div>
            </div>
            <p className="text-foreground-600 mb-4 max-w-md">
              Your ultimate fitness companion. Track every rep, achieve every goal with our comprehensive fitness tracking platform.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:knvdurgaprasad610@gmail.com"
                className="text-foreground-400 hover:text-primary transition-colors"
                aria-label="Email us"
              >
                <IconMail size={20} />
              </a>
              <a
                href="#"
                className="text-foreground-400 hover:text-primary transition-colors"
                aria-label="Follow us on Instagram"
              >
                <IconBrandInstagram size={20} />
              </a>
              <a
                href="#"
                className="text-foreground-400 hover:text-primary transition-colors"
                aria-label="Follow us on Twitter"
              >
                <IconBrandTwitter size={20} />
              </a>
              <a
                href="#"
                className="text-foreground-400 hover:text-primary transition-colors"
                aria-label="Connect on LinkedIn"
              >
                <IconBrandLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/exercises"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Exercises
                </Link>
              </li>
              <li>
                <Link
                  href="/workout"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Workouts
                </Link>
              </li>
              <li>
                <Link
                  href="/activity"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Activity
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:knvdurgaprasad610@gmail.com"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-foreground-600 hover:text-primary transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-foreground-500 text-sm">
              © {currentYear} C7 Personal Fitness Studio. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/privacy-policy"
                className="text-foreground-500 hover:text-primary text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-foreground-500 hover:text-primary text-sm transition-colors"
              >
                Terms
              </Link>
              <a
                href="mailto:knvdurgaprasad610@gmail.com"
                className="text-foreground-500 hover:text-primary text-sm transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}