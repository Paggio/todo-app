import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

/**
 * Theme toggle button that switches between light and dark modes.
 *
 * Shows a Moon icon in light mode (click to go dark) and a Sun icon
 * in dark mode (click to go light). When the theme is "system", it
 * resolves the current system preference and toggles to the opposite.
 *
 * Uses ghost variant for minimal visual weight and meets the 44x44px
 * minimum touch target via the icon-lg size.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Resolve the currently active visual theme
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  const isDark = resolvedTheme === "dark"

  function handleToggle() {
    if (theme === "system") {
      // When on system, resolve current and set to opposite
      setTheme(isDark ? "light" : "dark")
    } else {
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="min-h-[44px] min-w-[44px]"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}
