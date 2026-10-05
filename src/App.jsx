import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Scores from './pages/Scores'
import GameCenter from './pages/GameCenter'
import Standings from './pages/Standings'
import Events from './pages/Events'
import SKIRegionals from './pages/SKIRegionals'
import SKIRegionalBracket from './pages/SKIRegionalBracket'
import SKIChampions from './pages/SKIChampions'
import SKIChampionsBracket from './pages/SKIChampionsBracket'
import Stats from './pages/Stats'
import More from './pages/More'
import FranchiseProfile from './pages/FranchiseProfile'
import FranchiseResume from './pages/FranchiseResume'
import FranchiseRoster from './pages/FranchiseRoster'
import FranchiseTransactions from './pages/FranchiseTransactions'
import CoachProfile from './pages/CoachProfile'
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
            <Route path="/events/ski-regionals" element={<SKIRegionals />} />
<Route path="/events/ski-regionals/:regionalSlug" element={<SKIRegionalBracket />} />
            <Route path="/events/ski-champions" element={<SKIChampions />} />
            <Route path="/events/ski-champions/bracket" element={<SKIChampionsBracket />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/more" element={<More />} />
            <Route path="/franchise/:franchiseId" element={<FranchiseProfile />} />
            <Route path="/franchise/:franchiseId/resume" element={<FranchiseResume />} />
            <Route path="/franchise/:franchiseId/roster" element={<FranchiseRoster />} />
            <Route path="/franchise/:franchiseId/transactions" element={<FranchiseTransactions />} />
            <Route path="/coach/:coachId" element={<CoachProfile />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
export default App
