import { useState, useCallback } from 'react'
import { NotificationType } from '../components/Notification'

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: NotificationData = {
      id,
      type,
      title,
      message,
      duration
    }
    
    setNotifications(prev => [...prev, notification])
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('success', title, message, duration)
  }, [addNotification])

  const showError = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('error', title, message, duration)
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('warning', title, message, duration)
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('info', title, message, duration)
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
