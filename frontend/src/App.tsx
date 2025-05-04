import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import layout and pages (to be created)
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import NewProjectPage from './pages/NewProjectPage'
import EditProjectPage from './pages/EditProjectPage'
import ProjectReportPage from './pages/ProjectReportPage'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects">
              <Route index element={<Navigate to="/" replace />} />
              <Route path="new" element={<NewProjectPage />} />
              <Route path=":projectId" element={<ProjectPage />} />
              <Route path="edit/:projectId" element={<EditProjectPage />} />
              <Route path=":projectId/report" element={<ProjectReportPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
