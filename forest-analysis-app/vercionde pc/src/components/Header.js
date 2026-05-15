import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-mark" aria-hidden="true" />
        <div>
          <span className="brand-title">Forest Analysis</span>
          <span className="brand-subtitle">MVP GIS forestal</span>
        </div>
      </div>

      <nav className="header-nav" aria-label="Navegacion principal">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Mapa
        </NavLink>
        <NavLink to="/zonas" className={({ isActive }) => (isActive ? 'active' : '')}>
          Zonas
        </NavLink>
        <NavLink to="/especies" className={({ isActive }) => (isActive ? 'active' : '')}>
          Especies
        </NavLink>
        <NavLink to="/reportes" className={({ isActive }) => (isActive ? 'active' : '')}>
          Reportes
        </NavLink>
        <NavLink to="/extraccion" className={({ isActive }) => (isActive ? 'active' : '')}>
          Extraccion
        </NavLink>
      </nav>

      <div className="header-status">
        <span className="status-dot" />
        API REST
      </div>
    </header>
  );
}

export default Header;
