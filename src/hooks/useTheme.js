import { useState, useEffect, useCallback } from 'react'
import { getStoredString, setStoredString } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = getStoredString(STORAGE_KEY, '')
      if (saved) return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  // apply theme to document on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setStoredString(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const setTheme = useCallback((t) => {
    setThemeState(t)
  }, [])

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' }
}
