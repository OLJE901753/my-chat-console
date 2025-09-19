import { NORWEGIAN_FORMATS } from '@/constants/nessa';

/**
 * Norwegian date and time formatting utilities
 */
export const norwegianUtils = {
  /**
   * Format date in Norwegian format (DD.MM.YYYY)
   */
  formatDate: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(NORWEGIAN_FORMATS.locale, {
      timeZone: NORWEGIAN_FORMATS.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Format time in Norwegian format (HH:mm)
   */
  formatTime: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(NORWEGIAN_FORMATS.locale, {
      timeZone: NORWEGIAN_FORMATS.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format date and time in Norwegian format (DD.MM.YYYY HH:mm)
   */
  formatDateTime: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(NORWEGIAN_FORMATS.locale, {
      timeZone: NORWEGIAN_FORMATS.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format numbers in Norwegian style (comma as decimal separator)
   */
  formatNumber: (num: number, decimals: number = 1) => {
    return num.toLocaleString(NORWEGIAN_FORMATS.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Get Norwegian month name
   */
  getMonthName: (monthIndex: number) => {
    const months = [
      'januar', 'februar', 'mars', 'april', 'mai', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'desember'
    ];
    return months[monthIndex] || '';
  },

  /**
   * Get Norwegian day name
   */
  getDayName: (dayIndex: number) => {
    const days = [
      'søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'
    ];
    return days[dayIndex] || '';
  },

  /**
   * Format temperature with Norwegian conventions
   */
  formatTemperature: (temp: number) => {
    return `${norwegianUtils.formatNumber(temp, 1)}°C`;
  },

  /**
   * Format wind speed in Norwegian units
   */
  formatWindSpeed: (speed: number) => {
    return `${norwegianUtils.formatNumber(speed, 1)} m/s`;
  },

  /**
   * Format precipitation in Norwegian units
   */
  formatPrecipitation: (mm: number) => {
    return `${norwegianUtils.formatNumber(mm, 1)} mm`;
  },

  /**
   * Get relative time in Norwegian
   */
  getRelativeTime: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return norwegianUtils.formatDate(d);
  },

  /**
   * Check if current time is within Norwegian business hours
   */
  isBusinessHours: () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Monday-Friday 08:00-16:00
    return day >= 1 && day <= 5 && hour >= 8 && hour < 16;
  },

  /**
   * Get Norwegian growing season status
   */
  getGrowingSeasonStatus: () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    if (month < 3 || (month === 3 && day < 15)) {
      return { status: 'dormant', norwegian: 'Dormant Period', color: 'text-gray-400' };
    }
    if (month === 3 || (month === 4 && day < 15)) {
      return { status: 'planting', norwegian: 'Planting Season', color: 'text-blue-400' };
    }
    if (month >= 4 && month <= 6) {
      return { status: 'growing', norwegian: 'Growing Season', color: 'text-green-400' };
    }
    if (month >= 7 && month <= 10) {
      return { status: 'harvest', norwegian: 'Harvest Season', color: 'text-yellow-400' };
    }
    return { status: 'winter_prep', norwegian: 'Winter Preparation', color: 'text-blue-300' };
  }
};

export default norwegianUtils;