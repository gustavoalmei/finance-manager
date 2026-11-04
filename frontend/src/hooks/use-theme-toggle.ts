import { useTheme } from '#/components/theme-provider'

export const useThemeToggle = () => {
  const { setTheme } = useTheme()

  // a classe no <html> já resolve o tema "system"
  return () => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }
}
