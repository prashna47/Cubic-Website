import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import ApiAuthBridge from '@/components/ApiAuthBridge'
import Home from '@/pages/Home'
import About from '@/pages/About'
import Login from '@/pages/Login'
import SignUpPage from '@/pages/SignUp'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <>
      <ApiAuthBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          {/* Clerk components use sub-routes, so match the whole subtree. */}
          <Route path="login/*" element={<Login />} />
          <Route path="sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
