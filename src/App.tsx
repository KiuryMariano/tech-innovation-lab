import { Route, Routes } from 'react-router'
import MenuPage from './pages/Menu'
import YoloAnalyticsPage from './pages/YoloAnalytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/yolo-analytics" element={<YoloAnalyticsPage />} />
    </Routes>
  )
}
