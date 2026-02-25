export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (import.meta.server) return

  const { isAuthenticated } = useAuth()

  // If trying to access login page while authenticated, redirect to dashboard
  if (to.path === '/login' && isAuthenticated()) {
    return navigateTo('/', { replace: true })
  }

  // If trying to access protected pages while not authenticated, redirect to login
  if (to.path !== '/login' && !isAuthenticated()) {
    return navigateTo('/login', { replace: true })
  }
})
