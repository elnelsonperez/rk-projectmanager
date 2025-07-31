import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import layout and pages
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import NewProjectPage from './pages/NewProjectPage'
import EditProjectPage from './pages/EditProjectPage'
import ProjectReportPage from './pages/ProjectReportPage'
import AuditLogsPage from './pages/AuditLogsPage'
import ProjectAuditLogsPage from './pages/ProjectAuditLogsPage'
import QuotationPage from './pages/QuotationPage'
import { ToastContainer } from './components/ui/toast'

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
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="cotizaciones" element={<QuotationPage />} />
            <Route path="projects">
              <Route index element={<Navigate to="/" replace />} />
              <Route path="new" element={<NewProjectPage />} />
              <Route path=":projectId" element={<ProjectPage />} />
              <Route path="edit/:projectId" element={<EditProjectPage />} />
              <Route path=":projectId/report" element={<ProjectReportPage />} />
              <Route path=":projectId/audit-logs" element={<ProjectAuditLogsPage />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
      </Router>
    </QueryClientProvider>
  )
}

export default App
