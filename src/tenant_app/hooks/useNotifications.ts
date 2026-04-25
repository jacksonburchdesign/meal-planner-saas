import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useTenantData } from '../../context/TenantDataContext';

export function useNotifications() {
  const { notifications, notificationsLoading } = useTenantData();

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id!), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading: notificationsLoading, markAsRead, markAllAsRead, unreadCount };
}
