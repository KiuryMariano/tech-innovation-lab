import { Route, Routes } from 'react-router'
import ImageDatabasePage from './pages/ImageDatabase'
import MenuPage from './pages/Menu'
import YoloAnalyticsPage from './pages/YoloAnalytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/yolo-analytics" element={<YoloAnalyticsPage />} />
      <Route path="/image-database" element={<ImageDatabasePage />} />
    </Routes>
  )
}
