import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos los componentes de página que definen las vistas
import HomePage from '/pages/HomePage';
import FavoritesPage from '/pages/FavoritesPage';
import CityDetailPage from '/pages/CityDetailPage';

const App = () => {
  return (
    // BrowserRouter: Allows navigation in the SPA
    <BrowserRouter basename="/Reactgeoproyect">
      <div className="App w-full min-h-screen">
        {/* Routes: Container for all route definitions */}

        <Routes>
          
          {/* Main path: / */}
          <Route path="/" element={<HomePage />} />
          
          {/* Favorites path: /favorites */}
          <Route path="/favorites" element={<FavoritesPage />} />
          
          {/* Dynamic path: /city/nombre-ciudad (using the parameter :cityName) */}
          <Route path="/city/:cityName" element={<CityDetailPage />} />
          
          {/* Fallback path: 404 */}
          <Route path="*" element={<h1 className="text-4xl text-center mt-20">404 - Page not found</h1>} />
        </Routes>
        <p id="cfooter" className="cfooter">
          Alessandro Torres 2025 v.1.0 |
          <a href="https://www.espaciopsicologico.mx/alessandro">&nbsp;Portfolio</a>
        </p>
      </div>
    </BrowserRouter>
    
  );
};

export default App;