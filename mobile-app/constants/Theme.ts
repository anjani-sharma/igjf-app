// constants/Theme.ts
export const Theme = {
  colors: {
    primary: '#1B2951',
    secondary: '#2D5016',
    accent: '#E0E0E0',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#000000',
      secondary: '#666666',
      onPrimary: '#ffffff',
      onSecondary: '#ffffff',
    },
    border: '#E0E0E0',
    error: '#FF5252',
    success: '#4CAF50',
    warning: '#FF9800',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      lineHeight: 24,
    },
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Common layout styles
export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  
  header: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
  },
  
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  form: {
    gap: Theme.spacing.md,
  },
  
  input: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.body1.fontSize,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  
  primaryButton: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  buttonText: {
    ...Theme.typography.button,
    color: Theme.colors.text.onSecondary,
  },
  
  secondaryButtonText: {
    ...Theme.typography.button,
    color: Theme.colors.surface,
  },
};