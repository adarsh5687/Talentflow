import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { checkDataExists, seedDatabase } from './lib/seedData'
import JobsPage from './pages/JobsPage'
import CandidatesPage from './pages/CandidatesPage'
import CandidateDetailsPage from './pages/CandidateDetailsPage'
import AssessmentsPage from './pages/AssessmentsPage'
import AssessmentRuntimePage from './pages/AssessmentRuntimePage'
import Navigation from './components/Navigation'
async function initializeData() {
  try {
    const dataExists = await checkDataExists()
    if (!dataExists) {
      await seedDatabase()
    }
  } catch (error) {
    console.error('Failed to initialize data:', error)
    throw error
  }
}
function MainLayout() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:jobId" element={<JobsPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:candidateId" element={<CandidateDetailsPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:jobId" element={<AssessmentsPage />} />
            <Route path="/assessment/:assessmentId/candidate/:candidateId" element={<AssessmentRuntimePage />} />
            <Route path="/assessment/:assessmentId" element={<AssessmentRuntimePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
function App() {
  const [dataInitialized, setDataInitialized] = useState(false)
  useEffect(() => {
    initializeData()
      .then(() => {
        setDataInitialized(true)
      })
      .catch((error) => {
        console.error('Application initialization failed:', error)
        setDataInitialized(true) 
      })
  }, [])
  if (!dataInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing TalentFlow...
          </h1>
          <p className="text-gray-600">Setting up application data</p>
        </div>
      </div>
    )
  }
  return (
    <Provider store={store}>
      <MainLayout />
    </Provider>
  )
}
export default App
