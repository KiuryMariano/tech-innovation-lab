import { Route, Routes } from 'react-router'
import AiChatbotPage from './pages/AiChatbot'
import ImageDatabasePage from './pages/ImageDatabase'
import MenuPage from './pages/Menu'
import YoloAnalyticsPage from './pages/YoloAnalytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/yolo-analytics" element={<YoloAnalyticsPage />} />
      <Route path="/image-database" element={<ImageDatabasePage />} />
      <Route path="/ai-chatbot" element={<AiChatbotPage />} />
    </Routes>
  )
}
