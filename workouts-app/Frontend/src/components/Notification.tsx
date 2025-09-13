import React, { useEffect } from 'react'
import { Icon } from './Icon'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationProps {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

export function Notification({ id, type, title, message, duration = 5000, onClose }: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle'
      case 'error':
        return 'x-circle'
      case 'warning':
        return 'alert-triangle'
      case 'info':
        return 'info'
      default:
        return 'info'
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`notification ${getColorClasses()}`}>
      <div className="notification-content">
        <div className="notification-icon">
          <Icon name={getIcon()} size={20} className={getIconColor()} />
        </div>
        <div className="notification-text">
          <div className="notification-title">{title}</div>
          <div className="notification-message">{message}</div>
        </div>
        <button
          className="notification-close"
          onClick={() => onClose(id)}
          aria-label="Close notification"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  )
}

// Notification Container Component
export interface NotificationContainerProps {
  notifications: Array<NotificationProps & { id: string }>
  onClose: (id: string) => void
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={onClose}
        />
      ))}
    </div>
  )
}
