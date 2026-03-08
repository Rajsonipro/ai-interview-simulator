import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current page based on location path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/history')) return 'history';
    if (path.includes('/interview')) return 'interview';
    if (path.includes('/report')) return 'report';
    return 'dashboard';
  };

  const handleNavigate = (page) => {
    navigate(`/${page}`);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar navigate={handleNavigate} currentPage={getCurrentPage()} />
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
