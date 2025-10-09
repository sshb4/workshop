// lib/themes.ts

export interface ColorScheme {
  id: string
  name: string
  description: string
  preview: {
    primary: string
    secondary: string
    background: string
  }
  styles: {
    // Primary colors
    primary: string
    primaryHover: string
    primaryLight: string
    
    // Background colors
    background: string
    backgroundSecondary: string
    
    // Text colors
    textPrimary: string
    textSecondary: string
    
    // Border colors
    border: string
    borderLight: string
    
    // Accent colors
    accent: string
    accentHover: string
  }
}

export const colorSchemes: ColorScheme[] = [
  {
    id: 'default',
    name: 'Classic Blue',
    description: 'Clean and professional with indigo accents',
    preview: {
      primary: '#4F46E5',
      secondary: '#F8FAFC',
      background: '#FFFFFF'
    },
    styles: {
      primary: '#4F46E5',
      primaryHover: '#4338CA',
      primaryLight: '#EEF2FF',
      background: '#FFFFFF',
      backgroundSecondary: '#F8FAFC',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      accent: '#10B981',
      accentHover: '#059669'
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Modern dark theme with purple accents',
    preview: {
      primary: '#8B5CF6',
      secondary: '#1F2937',
      background: '#111827'
    },
    styles: {
      primary: '#8B5CF6',
      primaryHover: '#7C3AED',
      primaryLight: '#2D1B69',
      background: '#111827',
      backgroundSecondary: '#1F2937',
      textPrimary: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151',
      borderLight: '#4B5563',
      accent: '#06D6A0',
      accentHover: '#05B690'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and calming with green tones',
    preview: {
      primary: '#059669',
      secondary: '#F0FDF4',
      background: '#FFFFFF'
    },
    styles: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#ECFDF5',
      background: '#FFFFFF',
      backgroundSecondary: '#F0FDF4',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#D1FAE5',
      borderLight: '#F3F4F6',
      accent: '#3B82F6',
      accentHover: '#2563EB'
    }
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Energetic orange and warm tones',
    preview: {
      primary: '#EA580C',
      secondary: '#FFF7ED',
      background: '#FFFFFF'
    },
    styles: {
      primary: '#EA580C',
      primaryHover: '#C2410C',
      primaryLight: '#FFF7ED',
      background: '#FFFFFF',
      backgroundSecondary: '#FFF7ED',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#FED7AA',
      borderLight: '#F3F4F6',
      accent: '#8B5CF6',
      accentHover: '#7C3AED'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Cool and refreshing blue theme',
    preview: {
      primary: '#0EA5E9',
      secondary: '#F0F9FF',
      background: '#FFFFFF'
    },
    styles: {
      primary: '#0EA5E9',
      primaryHover: '#0284C7',
      primaryLight: '#F0F9FF',
      background: '#FFFFFF',
      backgroundSecondary: '#F0F9FF',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#BAE6FD',
      borderLight: '#F3F4F6',
      accent: '#F59E0B',
      accentHover: '#D97706'
    }
  }
]

export function getColorScheme(id: string): ColorScheme {
  return colorSchemes.find(scheme => scheme.id === id) || colorSchemes[0]
}

export function generateThemeCSS(scheme: ColorScheme): string {
  return `
    :root {
      --theme-primary: ${scheme.styles.primary};
      --theme-primary-hover: ${scheme.styles.primaryHover};
      --theme-primary-light: ${scheme.styles.primaryLight};
      --theme-background: ${scheme.styles.background};
      --theme-background-secondary: ${scheme.styles.backgroundSecondary};
      --theme-text-primary: ${scheme.styles.textPrimary};
      --theme-text-secondary: ${scheme.styles.textSecondary};
      --theme-border: ${scheme.styles.border};
      --theme-border-light: ${scheme.styles.borderLight};
      --theme-accent: ${scheme.styles.accent};
      --theme-accent-hover: ${scheme.styles.accentHover};
    }
  `
}
