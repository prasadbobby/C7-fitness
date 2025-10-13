import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { IconScale, IconUserCheck, IconShield, IconMail, IconAlertTriangle } from "@tabler/icons-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <IconScale className="text-primary" size={36} />
          Terms of Service
        </h1>
        <p className="text-foreground-500">Last updated: October 2025</p>
      </div>

      <div className="space-y-6">
        <Card shadow="none" className="shadow-md">
          <CardBody className="p-6">
            <p className="text-foreground-600 leading-relaxed">
              By using the C7 Personal Fitness Studio web application ("Service"), you agree to be bound by these Terms of Service ("Terms").
              Please read these terms carefully before using our comprehensive fitness tracking platform, which includes workout logging, progress tracking, trainer assignments, goal setting, and third-party integrations.
            </p>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconUserCheck className="text-success" size={24} />
              <h2 className="text-xl font-semibold text-foreground">1. Use of Service</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-4 text-foreground-600">
              <p>By accessing and using our comprehensive fitness tracking web application, you agree to these Terms of Service.</p>

              <div>
                <p className="font-semibold mb-2">Acceptable Use:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>You must provide accurate information when creating your account, logging workouts, and setting fitness goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>Use the app only for legitimate fitness tracking, health monitoring, and training purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>You must be at least 13 years old to use this service (minors require parental consent)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>Respect trainer-client relationships and maintain professional communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>Keep your account credentials secure and do not share them with others</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">Prohibited Activities:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-danger">•</span>
                    <span>Reverse engineering, hacking, or attempting to compromise app security</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">•</span>
                    <span>Uploading malicious content, viruses, or harmful code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">•</span>
                    <span>Impersonating trainers or other users, or creating fake accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">•</span>
                    <span>Using the app for commercial purposes without explicit permission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">•</span>
                    <span>Spamming, harassment, or inappropriate communication with trainers or other users</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconShield className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-foreground">2. Fitness Data Access & Consent</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-4 text-foreground-600">
              <p>By using our fitness tracking application, you consent to the collection and processing of various types of data:</p>

              <div>
                <p className="font-semibold mb-2">Fitness & Health Data Collection:</p>
                <ul className="space-y-2 ml-4 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Workout Data:</strong> Exercise logs, sets, reps, weights, workout duration and frequency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Progress Metrics:</strong> Strength gains, body measurements, fitness level improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Goal & Plan Data:</strong> Personal fitness goals, workout plans, training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Third-Party Integration:</strong> Google Fit data (steps, heart rate, sleep, distance) when connected</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">Trainer & Social Data:</p>
                <ul className="space-y-2 ml-4 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Trainer Communications:</strong> Messages, feedback, and workout assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Progress Sharing:</strong> Workout completion and performance data shared with assigned trainers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span><strong>Challenge Participation:</strong> Competition and challenge-related data and results</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                <p className="text-sm text-primary font-medium">
                  <strong>Your Control:</strong> You maintain full control over your data sharing preferences. You can disconnect third-party integrations,
                  change trainer assignments, modify privacy settings, or request data deletion at any time through the app settings.
                </p>
              </div>

              <p><strong>Data Usage:</strong> All collected data is used exclusively to provide you with comprehensive fitness tracking,
              personalized workout recommendations, progress monitoring, trainer-client coaching features, and app functionality improvements.</p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconUserCheck className="text-warning" size={24} />
              <h2 className="text-xl font-semibold text-foreground">3. Account Responsibility</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-3 text-foreground-600">
              <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p><strong>Accurate Information:</strong> You agree to provide accurate fitness data and personal information necessary for the proper functioning of the service.</p>
              <p><strong>Trainer Assignments:</strong> If assigned a trainer, you consent to sharing your fitness progress and goal completion data with them for coaching purposes.</p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconAlertTriangle className="text-danger" size={24} />
              <h2 className="text-xl font-semibold text-foreground">4. Limitation of Liability</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-4 text-foreground-600">
              <p><strong>Service "As Is":</strong> We provide this fitness tracking service "as is" without warranties of any kind,
              either express or implied, including but not limited to the accuracy of fitness data or uninterrupted service availability.</p>

              <p><strong>Health & Fitness Disclaimer:</strong></p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>We are not responsible for any fitness-related injuries that may occur while using this app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>This app is for fitness tracking only and does not provide medical advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>Consult with healthcare professionals before starting any fitness program</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>Fitness data may not be 100% accurate due to device limitations</span>
                </li>
              </ul>

              <p><strong>Data Issues:</strong> We are not liable for data loss, sync failures, or temporary unavailability
              of connected fitness services (such as Google Fit outages).</p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconScale className="text-success" size={24} />
              <h2 className="text-xl font-semibold text-foreground">5. Service Availability & Modifications</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-3 text-foreground-600">
              <p><strong>Service Changes:</strong> We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice to users.</p>
              <p><strong>Terms Updates:</strong> These Terms may be updated periodically. Continued use of the service constitutes acceptance of any changes.</p>
              <p><strong>Data Export:</strong> Upon service discontinuation, we will provide reasonable notice and options for data export where technically feasible.</p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconMail className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-foreground">6. Contact Information</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <p className="text-foreground-600 mb-4">
              If you have any questions about these Terms of Service, our fitness data practices, or need support, please contact us:
            </p>
            <div className="p-4 bg-default-50 rounded-lg border">
              <p className="font-medium text-foreground">C7 Personal Fitness Studio</p>
              <p className="text-foreground-600">
                Email: <a href="mailto:knvdurgaprasad610@gmail.com" className="text-primary hover:underline">knvdurgaprasad610@gmail.com</a>
              </p>
              <p className="text-sm text-foreground-500 mt-2">
                We typically respond to inquiries within 24-48 hours during business days.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md border border-success/20 bg-success/5">
          <CardBody className="p-6">
            <div className="flex items-start gap-3">
              <IconUserCheck className="text-success mt-1" size={20} />
              <div>
                <p className="font-medium text-success mb-2">Consent Acknowledgment</p>
                <p className="text-sm text-foreground-600 leading-relaxed">
                  By using our fitness tracking application and connecting your Google Fit account, you acknowledge that you have read,
                  understood, and agree to these Terms of Service. You also consent to the collection and use of your fitness data
                  as described in our Privacy Policy for the purpose of providing you with comprehensive fitness tracking and progress monitoring services.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}