import { notFound, redirect } from "next/navigation";
import {
  AccountSettings,
  AppearanceSettings,
  DisplaySettings,
  NotificationSettings,
  ProfileSettings,
} from "@/components/settings/settings-forms";
import { getSession } from "@/services/auth";

const sections = {
  profile: ProfileSettings,
  account: AccountSettings,
  appearance: AppearanceSettings,
  notifications: NotificationSettings,
  display: DisplaySettings,
};

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (session.user.role !== "administrator") {
    return <div>Access Denied</div>;
  }

  const { section } = await params;
  const Section = sections[section as keyof typeof sections];
  if (!Section) notFound();

  return <Section />;
}
