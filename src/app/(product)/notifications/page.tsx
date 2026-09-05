import { NotificationsList } from "@/components/notifications-list";
import { listNotifications } from "@/data/notifications";

export default async function NotificationsPage() {
  return <NotificationsList initialNotifications={await listNotifications()} />;
}
