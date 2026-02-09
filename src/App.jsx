import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import RescueRequestCreatePage from './pages/citizen/RescueRequestCreatePage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RescueRequestCreatePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
