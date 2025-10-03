import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import PageHeading from "@/components/PageHeading/PageHeading";
import { ChallengeManagement } from "./_components/ChallengeManagement";
import { ParticipantManagement } from "./_components/ParticipantManagement";

export default async function NinetyDayChallengePage() {
  const { isAdmin } = await checkAdminAuth();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <PageHeading
        title="90-Day Challenge Management"
        subtitle="Manage transformation challenges and participant progress"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Challenge Management */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              Challenge Management
            </h2>
          </div>
          <ChallengeManagement />
        </div>

        {/* Participant Management */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              Participant Management
            </h2>
          </div>
          <ParticipantManagement />
        </div>
      </div>
    </div>
  );
}