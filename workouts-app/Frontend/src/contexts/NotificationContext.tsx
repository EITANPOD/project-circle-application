import React, { createContext, useContext, ReactNode } from 'react'
import { useNotifications, NotificationData } from '../hooks/useNotifications'
import { NotificationContainer, NotificationProps } from '../components/Notification'

interface NotificationContextType {
  showSuccess: (title: string, message: string, duration?: number) => string
  showError: (title: string, message: string, duration?: number) => string
  showWarning: (title: string, message: string, duration?: number) => string
  showInfo: (title: string, message: string, duration?: number) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll
  } = useNotifications()

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll
  }

  // Convert NotificationData to NotificationProps format
  const notificationProps: Array<NotificationProps & { id: string }> = notifications.map(notification => ({
    ...notification,
    onClose: removeNotification
  }))

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notificationProps}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  )
}
