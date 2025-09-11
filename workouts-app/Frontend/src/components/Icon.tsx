import React from 'react'
import {
  Dumbbell,
  TrendingUp,
  Target,
  Bot,
  User,
  Settings,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Share2,
  Search,
  Play,
  Pause,
  Clock,
  Award,
  BarChart3,
  Users,
  Heart,
  Zap,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Edit,
  Save,
  Download,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  RefreshCw,
  Star,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Timer,
  Flame,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Lightbulb,
  Shield,
  Lock,
  Unlock,
  Bell,
  Mail,
  Phone,
  MapPin,
  Globe,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Snowflake,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Sunrise,
  Sunset,
  Star as StarIcon,
  StarHalf,
  StarOff,
  Heart as HeartIcon,
  HeartHandshake,
  HandHeart,
  Handshake,
  HandCoins,
  HandPlatter,
  HandMetal,
  Hand,
  Home,
  UserPlus, AlertTriangle
} from 'lucide-react'

interface IconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

const iconMap: Record<string, React.ComponentType<any>> = {
  // Workout & Fitness
  'dumbbell': Dumbbell,
  'trending-up': TrendingUp,
  'target': Target,
  'bot': Bot,
  'activity': Activity,
  'timer': Timer,
  'flame': Flame,
  'trophy': Trophy,
  'medal': Medal,
  'crown': Crown,
  'sparkles': Sparkles,
  'award': Award,
  'heart': Heart,
  'zap': Zap,
  
  // Navigation & Actions
  'home': Home,
  'user': User,
  'user-plus': UserPlus,
  'alert-triangle': AlertTriangle,
  'settings': Settings,
  'plus': Plus,
  'trash': Trash2,
  'trash-2': Trash2,
  'eye': Eye,
  'calendar': Calendar,
  'share': Share2,
  'search': Search,
  'play': Play,
  'pause': Pause,
  'clock': Clock,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'x': X,
  'check': Check,
  'edit': Edit,
  'save': Save,
  'download': Download,
  'upload': Upload,
  'filter': Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  'more': MoreHorizontal,
  'refresh': RefreshCw,
  
  // Social & Community
  'star': Star,
  'bookmark': Bookmark,
  'message': MessageCircle,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  'users': Users,
  'handshake': Handshake,
  'hand-heart': HandHeart,
  'hand-coins': HandCoins,
  'hand-platter': HandPlatter,
  'hand-metal': HandMetal,
  'hand': Hand,
  
  // Analytics & Charts
  'bar-chart': BarChart3,
  
  // UI Elements
  'lightbulb': Lightbulb,
  'shield': Shield,
  'lock': Lock,
  'unlock': Unlock,
  'bell': Bell,
  'mail': Mail,
  'phone': Phone,
  'map-pin': MapPin,
  'globe': Globe,
  'wifi': Wifi,
  'wifi-off': WifiOff,
  'battery': Battery,
  'battery-low': BatteryLow,
  'volume': Volume2,
  'volume-off': VolumeX,
  
  // Weather & Environment
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'wind': Wind,
  'thermometer': Thermometer,
  'droplets': Droplets,
  'snowflake': Snowflake,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-drizzle': CloudDrizzle,
  'sunrise': Sunrise,
  'sunset': Sunset,
  'star-icon': StarIcon,
  'star-half': StarHalf,
  'star-off': StarOff,
  'heart-icon': HeartIcon
}

export function Icon({ name, size = 24, className = '', color }: IconProps) {
  const IconComponent = iconMap[name.toLowerCase()]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return <div className={`w-${size} h-${size} ${className}`} />
  }
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      color={color}
    />
  )
}
