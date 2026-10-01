import './App.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import BottomNav from './components/BottomNav'

import Home from './pages/Home'
import Scores from './pages/Scores'
import GameCenter from './pages/GameCenter'
import Standings from './pages/Standings'
import Events from './pages/Events'
import Stats from './pages/Stats'
import More from './pages/More'
import FranchiseProfile from './pages/FranchiseProfile'
import FranchiseResume from './pages/FranchiseResume'
import FranchiseRoster from './pages/FranchiseRoster'
import FranchiseTransactions from './pages/FranchiseTransactions'

function App() {
  return (
    <BrowserRouter>
      <div className="mesh-app">
        <Header />

        <main className="mesh-app__content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/scores/:gameId" element={<GameCenter />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/events" element={<Events />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/more" element={<More />} />
            <Route path="/franchise/:franchiseId" element={<FranchiseProfile />} />
            <Route path="/franchise/:franchiseId/resume" element={<FranchiseResume />} />
            <Route path="/franchise/:franchiseId/roster" element={<FranchiseRoster />} />
            <Route path="/franchise/:franchiseId/transactions" element={<FranchiseTransactions />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App