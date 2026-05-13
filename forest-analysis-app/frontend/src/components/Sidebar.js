import React from 'react';
import './Sidebar.css';

function Sidebar({ title, children }) {
  return (
    <aside className="sidebar" aria-label={title || 'Panel lateral'}>
      {title && <h2 className="sidebar-title">{title}</h2>}
      <div className="sidebar-content">{children}</div>
    </aside>
  );
}

export default Sidebar;
