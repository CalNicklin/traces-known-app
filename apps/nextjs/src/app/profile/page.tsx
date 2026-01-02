import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <ProfileContent user={session.user} />
      </div>
    </div>
  );
}
