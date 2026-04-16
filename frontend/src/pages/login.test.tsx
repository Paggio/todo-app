import { cleanup, render, act } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// --- Mocks ---

const mockNavigate = vi.fn()
const mockLocation = { state: null, pathname: "/login", search: "", hash: "", key: "default" }

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))

vi.mock("@/lib/motion", () => ({
  prefersReducedMotion: false,
  motionDuration: (ms: number) => ms,
}))

vi.mock("@/components/auth-screen", () => ({
  AuthScreen: ({ isExiting }: { isExiting?: boolean }) => (
    <div data-testid="auth-screen" data-exiting={isExiting} />
  ),
}))

let authState = { isAuthenticated: false, isLoading: true, user: null, setUser: vi.fn() }

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authState,
}))

// Import after mocks are set up
const { LoginPage } = await import("./login")

describe("LoginPage redirect", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockNavigate.mockClear()
    mockLocation.state = null
    authState = { isAuthenticated: false, isLoading: true, user: null, setUser: vi.fn() }
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it("redirects to / after animation delay on fresh login", () => {
    const { rerender } = render(<LoginPage />)

    // Loading finishes, user is not authenticated — shows auth screen
    authState = { ...authState, isLoading: false, isAuthenticated: false }
    rerender(<LoginPage />)

    expect(mockNavigate).not.toHaveBeenCalled()

    // User logs in — isAuthenticated becomes true
    authState = { ...authState, isAuthenticated: true, user: { id: 1, email: "a@b.com", createdAt: "" } }
    rerender(<LoginPage />)

    // Navigation should NOT have happened yet (waiting for animation)
    expect(mockNavigate).not.toHaveBeenCalled()

    // Advance past the 300ms animation delay
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it("redirects immediately when user already has a valid session", () => {
    // Auth loads and user is already authenticated
    authState = { ...authState, isLoading: false, isAuthenticated: true, user: { id: 1, email: "a@b.com", createdAt: "" } }
    render(<LoginPage />)

    // Should redirect immediately without animation
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it("redirects to the 'from' location when provided", () => {
    const { rerender } = render(<LoginPage />)

    // Set the from state (e.g. AuthGuard redirected from /todos)
    mockLocation.state = { from: { pathname: "/todos" } }

    authState = { ...authState, isLoading: false, isAuthenticated: false }
    rerender(<LoginPage />)

    authState = { ...authState, isAuthenticated: true, user: { id: 1, email: "a@b.com", createdAt: "" } }
    rerender(<LoginPage />)

    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledWith("/todos", { replace: true })
  })

  it("does not cancel navigation timer on re-render (regression)", () => {
    // This is the core regression test for the bug where setIsTransitioning(true)
    // caused a re-render that canceled the setTimeout via effect cleanup.
    const { rerender } = render(<LoginPage />)

    authState = { ...authState, isLoading: false, isAuthenticated: false }
    rerender(<LoginPage />)

    authState = { ...authState, isAuthenticated: true, user: { id: 1, email: "a@b.com", createdAt: "" } }
    rerender(<LoginPage />)

    // Simulate additional re-renders that could happen due to state changes.
    // Before the fix, the setIsTransitioning(true) call triggered a re-render
    // whose effect cleanup would clearTimeout, stranding the user.
    rerender(<LoginPage />)
    rerender(<LoginPage />)

    // The timer must still fire
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it("shows loading state while auth is resolving", () => {
    const { container } = render(<LoginPage />)
    // Should render empty div, not auth screen
    expect(container.querySelector("[data-testid='auth-screen']")).toBeNull()
  })

  it("passes isExiting to AuthScreen during transition", () => {
    const { rerender, getByTestId } = render(<LoginPage />)

    authState = { ...authState, isLoading: false, isAuthenticated: false }
    rerender(<LoginPage />)

    // Before login, isExiting should be false
    expect(getByTestId("auth-screen").dataset.exiting).toBe("false")

    // Trigger login
    authState = { ...authState, isAuthenticated: true, user: { id: 1, email: "a@b.com", createdAt: "" } }
    rerender(<LoginPage />)

    // After login, isExiting should be true (animation playing)
    expect(getByTestId("auth-screen").dataset.exiting).toBe("true")
  })
})
