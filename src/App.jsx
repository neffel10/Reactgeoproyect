import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

import HomePage from '/pages/HomePage';
import FavoritesPage from '/pages/FavoritesPage';
import CityDetailPage from '/pages/CityDetailPage';
import { ThemeProvider, useTheme } from '/hooks/useTheme';

const AppContent = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
        <BrowserRouter basename="/Reactgeoproyect">
          <div className="App w-full min-h-screen flex flex-col">
            {/* Theme Toggle */}
            <div className="sticky top-0 z-50 flex justify-end p-4">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-yellow-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            {/* Routes */}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/city/:cityName" element={<CityDetailPage />} />
                <Route path="*" element={<h1 className="text-4xl text-center mt-20">404 - Page not found</h1>} />
              </Routes>
            </div>

            {/* Footer */}
            <footer id="cfooter" className={`border-t ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200 text-slate-600'
            } text-center py-6 px-4 mt-12`}>
              <p className="text-sm">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>© 2025 Alessandro Torres v.1.0</span>
                <span className="mx-2 text-slate-600">•</span>
                <a href="https://www.espaciopsicologico.mx/alessandro" className={`transition-colors ${
                  isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
                }`}>Portfolio</a>
              </p>
            </footer>
          </div>
        </BrowserRouter>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;