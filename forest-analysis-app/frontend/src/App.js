import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ZonesPage from './pages/ZonesPage';
import SpeciesPage from './pages/SpeciesPage';
import ReportsPage from './pages/ReportsPage';
import './styles/globals.css';
import './styles/components.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/zonas" element={<ZonesPage />} />
            <Route path="/especies" element={<SpeciesPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
