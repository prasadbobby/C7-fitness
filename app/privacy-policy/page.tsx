import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { IconShield, IconDatabase, IconUsers, IconMail } from "@tabler/icons-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <IconShield className="text-primary" size={36} />
          Privacy Policy
        </h1>
        <p className="text-foreground-500">Last updated: October 2025</p>
      </div>

      <div className="space-y-6">
        <Card shadow="none" className="shadow-md">
          <CardBody className="p-6">
            <p className="text-foreground-600 leading-relaxed">
              C7 Personal Fitness Studio ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our comprehensive fitness tracking web application, including workout logging, progress tracking, trainer assignments, nutrition monitoring, and third-party integrations.
            </p>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconDatabase className="text-success" size={24} />
              <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-6 text-foreground-600">
              <div>
                <p className="font-semibold mb-3">Account Information:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Personal Details:</strong> Name, email address, profile information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Physical Stats:</strong> Height, weight, age, fitness level, training goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Preferences:</strong> Workout preferences, notification settings, app configurations</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-3">Workout & Training Data:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Exercise Logs:</strong> Exercises performed, sets, reps, weights, duration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Workout Plans:</strong> Custom and assigned workout routines, training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Progress Tracking:</strong> Performance metrics, strength gains, body measurements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Session Data:</strong> Workout timestamps, rest periods, training intensity</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-3">Third-Party Integration Data:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Google Fit Data:</strong> Daily steps, distance, heart rate, sleep patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Activity Data:</strong> Calories burned, activity duration, movement patterns</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-3">Trainer & Social Features:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Trainer Communications:</strong> Messages, feedback, assigned workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Progress Sharing:</strong> Workout completion data shared with assigned trainers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Challenge Data:</strong> Participation in fitness challenges and competitions</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-3">Technical Information:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Usage Analytics:</strong> App usage patterns, feature interactions, session duration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Device Data:</strong> Browser type, device information, IP address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span><strong>Performance Data:</strong> App performance metrics, error logs, crash reports</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                <strong>Data Collection Principles:</strong> We only collect data that is necessary to provide and improve our fitness tracking services. You have control over what information you share and can modify your privacy settings at any time.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconUsers className="text-warning" size={24} />
              <h2 className="text-xl font-semibold text-foreground">How We Use Your Data</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <p className="text-foreground-600 mb-4">We use your personal information and fitness data for the following legitimate purposes:</p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground-600 mb-2">Core Fitness Tracking Services:</p>
                <ul className="space-y-2 text-foreground-600 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Display your workout logs, exercise history, and performance analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Track your progress toward personal and trainer-assigned fitness goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Generate workout plans and exercise recommendations based on your fitness level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Calculate metrics like volume, intensity, strength gains, and body composition changes</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground-600 mb-2">Activity & Health Integration:</p>
                <ul className="space-y-2 text-foreground-600 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Sync and display daily activity data (steps, distance, heart rate, sleep)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Provide real-time activity tracking and goal completion status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Calculate streaks, weekly averages, and long-term trend analysis</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground-600 mb-2">Trainer & Coaching Features:</p>
                <ul className="space-y-2 text-foreground-600 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Share your workout data and progress with assigned personal trainers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Enable trainers to create custom workout plans and track client progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Facilitate communication between trainers and clients regarding fitness goals</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground-600 mb-2">App Improvement & Support:</p>
                <ul className="space-y-2 text-foreground-600 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Analyze usage patterns to improve app functionality and user experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Provide customer support and troubleshoot technical issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Send important updates about app features and fitness program changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>Maintain app security, prevent abuse, and ensure data integrity</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconShield className="text-success" size={24} />
              <h2 className="text-xl font-semibold text-foreground">Data Storage & Security</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-4 text-foreground-600">
              <p><strong>Data Protection:</strong> All personal and fitness data is stored securely in encrypted databases using industry-standard security measures. We implement appropriate technical and organizational safeguards to protect your information against unauthorized access, alteration, disclosure, or destruction.</p>

              <p><strong>Data Sharing Policy:</strong> We do not sell, rent, or share your personal information with third parties for marketing purposes. Your data is only shared in the following limited circumstances:</p>
              <ul className="ml-6 space-y-1">
                <li>• With assigned personal trainers (only fitness progress and workout data)</li>
                <li>• With your explicit consent for specific features or integrations</li>
                <li>• When required by law or to protect our legal rights</li>
                <li>• With trusted service providers who assist in app operations (under strict confidentiality agreements)</li>
              </ul>

              <p><strong>Access Control:</strong> We maintain strict access controls to ensure that only authorized personnel can access your data. Your personal trainers can only view workout and progress data relevant to their coaching relationship with you.</p>

              <p><strong>Data Retention:</strong> We retain your data as long as your account is active and as needed to provide our services. You may request data deletion at any time. Some data may be retained for legal compliance or security purposes as required by law.</p>

              <p><strong>International Data Transfers:</strong> Your data may be processed and stored in different locations to ensure optimal app performance. All international transfers comply with applicable privacy laws and are protected by appropriate safeguards.</p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconUsers className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-foreground">Your Rights & Control</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <div className="space-y-4 text-foreground-600">
              <p className="font-semibold">You have the following rights regarding your personal data:</p>

              <div className="space-y-3">
                <p><strong>Access & Portability:</strong> Request a complete copy of all personal data we have collected about you, including workout logs, progress data, and account information. We will provide this in a machine-readable format when technically feasible.</p>

                <p><strong>Correction & Updates:</strong> Update your personal information, fitness goals, and preferences directly through the app settings. You can also request corrections to any inaccurate data we may have.</p>

                <p><strong>Data Deletion:</strong> Request permanent deletion of your account and all associated data. Please note that some data may need to be retained for legal compliance purposes.</p>

                <p><strong>Processing Restrictions:</strong> Request limitations on how we process your data, including opting out of certain features or data sharing arrangements.</p>

                <p><strong>Third-Party Disconnection:</strong> Disconnect Google Fit or other integrated services at any time through app settings or your respective service provider accounts. Manual data entry remains available as an alternative.</p>

                <p><strong>Trainer Assignment Control:</strong> Change or remove trainer assignments, controlling which fitness professionals can access your workout progress and data.</p>

                <p><strong>Communication Preferences:</strong> Opt out of non-essential communications while maintaining important account and security notifications.</p>

                <p><strong>Data Download:</strong> Export your workout data, progress charts, and fitness history for use with other applications or for personal records.</p>
              </div>

              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  <strong>Exercising Your Rights:</strong> To exercise any of these rights or if you have questions about your data, please contact us using the information provided below. We will respond to your request within 30 days and may require identity verification for security purposes.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md">
          <CardHeader className="px-6 pb-0">
            <div className="flex items-center gap-3">
              <IconMail className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
            </div>
          </CardHeader>
          <CardBody className="px-6 pt-3">
            <p className="text-foreground-600 mb-4">
              If you have any questions about this Privacy Policy, our data practices, or wish to exercise your rights regarding your data, please contact us:
            </p>
            <div className="p-4 bg-default-50 rounded-lg border">
              <p className="font-medium text-foreground">C7 Personal Fitness Studio</p>
              <p className="text-foreground-600">
                Email: <a href="mailto:knvdurgaprasad610@gmail.com" className="text-primary hover:underline">knvdurgaprasad610@gmail.com</a>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="none" className="shadow-md border border-warning/20 bg-warning/5">
          <CardBody className="p-6">
            <div className="flex items-start gap-3">
              <IconShield className="text-warning mt-1" size={20} />
              <div>
                <p className="font-medium text-warning mb-2">Important Consent & Data Usage Notice</p>
                <p className="text-sm text-foreground-600 leading-relaxed mb-3">
                  By using the C7 Personal Fitness Studio application, you consent to the collection, processing, and use of your personal and fitness data as described in this Privacy Policy. This includes:
                </p>
                <ul className="text-sm text-foreground-600 space-y-1 ml-4 mb-3">
                  <li>• Workout logs, exercise data, and fitness progress tracking</li>
                  <li>• Integration data from connected services like Google Fit</li>
                  <li>• Sharing relevant progress data with assigned personal trainers</li>
                  <li>• Account information necessary for app functionality and support</li>
                </ul>
                <p className="text-sm text-foreground-600 leading-relaxed">
                  You can modify your data sharing preferences, disconnect integrations, or withdraw your consent at any time through the app settings.
                  Continued use of the app after any updates to this policy constitutes acceptance of the revised terms.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}