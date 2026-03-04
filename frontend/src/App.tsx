import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import SearchResults from './pages/SearchResults'
import { SocketProvider } from "./context/SocketContext"
import './App.css'

function App() {
    return (
        <SocketProvider>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:slugOrId" element={<MovieDetail />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/search/:query" element={<SearchResults />} />
        </Routes>
        </SocketProvider>
    )
}

export default App
