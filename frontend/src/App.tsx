import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import SearchResults from './pages/SearchResults'
import './App.css'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:slugOrId" element={<MovieDetail />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/search/:query" element={<SearchResults />} />
        </Routes>
    )
}

export default App
