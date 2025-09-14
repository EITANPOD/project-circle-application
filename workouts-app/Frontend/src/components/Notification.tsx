import React, { useEffect } from 'react'
import { Icon } from './Icon'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationProps {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  isExiting?: boolean
  onClose: (id: string) => void
}

export function Notification({ id, type, title, message, duration = 5000, isExiting = false, onClose }: NotificationProps) {
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
        return 'border-green-500 text-green-700'
      case 'error':
        return 'border-red-500 text-red-700'
      case 'warning':
        return 'border-yellow-500 text-yellow-700'
      case 'info':
        return 'border-blue-500 text-blue-700'
      default:
        return 'border-gray-500 text-gray-700'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`notification ${getColorClasses()} ${isExiting ? 'slide-out' : ''}`}>
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
