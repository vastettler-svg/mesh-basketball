import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Scores from './pages/Scores'
import Standings from './pages/Standings'
import Events from './pages/Events'
import Stats from './pages/Stats'
import More from './pages/More'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/events" element={<Events />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/more" element={<More />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App