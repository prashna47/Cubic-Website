import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import ApiAuthBridge from '@/components/ApiAuthBridge'
import ScrollToTop from '@/components/ScrollToTop'
import Home from '@/pages/Home'
import GetStarted from '@/pages/GetStarted'
import Services from '@/pages/Services'
import ServiceDetail from '@/pages/ServiceDetail'
import JobHiring from '@/pages/JobHiring'
import DoNotApply from '@/pages/DoNotApply'
import InterviewBooking from '@/pages/InterviewBooking'
import ApplicationTracker from '@/pages/ApplicationTracker'
import ResumePrompt from '@/pages/ResumePrompt'
import OnboardingList from '@/pages/OnboardingList'
import FeedbackForm from '@/pages/FeedbackForm'
import Login from '@/pages/Login'
import SignUpPage from '@/pages/SignUp'
import NotFound from '@/pages/NotFound'
import RequireServiceAccess from '@/components/RequireServiceAccess'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ApiAuthBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="get-started" element={<GetStarted />} />
          <Route element={<RequireServiceAccess />}>
            <Route path="services" element={<Services />} />
            <Route path="services/job-hiring" element={<JobHiring />} />
            <Route path="services/do-not-apply-list" element={<DoNotApply />} />
            <Route
              path="services/interview-booking"
              element={<InterviewBooking />}
            />
            <Route
              path="services/candidate-directory"
              element={<ApplicationTracker />}
            />
            <Route
              path="services/application-tracker"
              element={<Navigate to="/services/candidate-directory" replace />}
            />
            <Route path="services/resume-prompt" element={<ResumePrompt />} />
            <Route
              path="services/onboarding-list"
              element={<OnboardingList />}
            />
            <Route path="services/feedback-form" element={<FeedbackForm />} />
            <Route path="services/:slug" element={<ServiceDetail />} />
          </Route>
          {/* Clerk components use sub-routes, so match the whole subtree. */}
          <Route path="login/*" element={<Login />} />
          <Route path="sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
