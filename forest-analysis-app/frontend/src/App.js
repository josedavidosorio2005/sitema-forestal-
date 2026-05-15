import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ZonesPage from './pages/ZonesPage';
import SpeciesPage from './pages/SpeciesPage';
import ReportsPage from './pages/ReportsPage';
import ExtractionCalculatorPage from './pages/ExtractionCalculatorPage';
import './styles/globals.css';
import './styles/components.css';
import './App.css';

function App() {
  return (
    <HashRouter>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/zonas" element={<ZonesPage />} />
            <Route path="/especies" element={<SpeciesPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/extraccion" element={<ExtractionCalculatorPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
