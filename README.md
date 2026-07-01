Weather & Advanced Geolocation Dashboard

A modern, highly responsive Single Page Application (SPA) built with React that provides real-time weather updates and 5-day atmospheric forecasts. This project highlights advanced API integration, custom state persistence, and responsive UI design tailored for an optimal user experience across all devices.

🔗 Live Demo: https://neffel10.github.io/Reactgeoproyect

💻 Source Code: https://github.com/neffel10/Reactgeoproyect/

🚀 Key Features

Smart Geocoding Search: Users can search for any city globally. The application leverages OpenWeatherMap's Geocoding API to translate city names into precise geographic coordinates (Latitude & Longitude) to fetch accurate atmospheric data.

5-Day / 3-Hour Extended Forecast: Integrates advanced data transformation algorithms to group 3-hourly weather packets into a clean, daily high/low temperature overview for the upcoming week.

Persistent Favorites Directory: Includes a custom favorites management system. Users can save their preferred cities with a single click, persisting data seamlessly across sessions via localized browser storage.

Robust Error Handling: Built with defensive programming principles. Implements specific guards against invalid API keys (401), missing locations (404), and fetch failures, displaying user-friendly fallback components instead of breaking the UI.

Fluid Responsive Design: Fully styled using Tailwind CSS, ensuring a polished, modern, and adaptive interface for mobile, tablet, and desktop screens with smooth micro-interactions.

🛠️ Tech Stack & Libraries

Frontend & Architecture

React (v18): Leveraged functional components, declarative UI paradigms, and modern hooks (useState, useEffect, useCallback) to manage clean render cycles and state transitions.

Custom React Hooks: Developed useFavorites to abstract state-handling and synchronization logic with localStorage, showcasing clean separation of concerns.

React Router DOM (HashRouter): Configured client-side routing optimized for static hosting servers (like GitHub Pages) to eliminate 404 routing errors.

Styling & Icons

Tailwind CSS: Employed a utility-first CSS workflow to create a responsive, modern interface with fluid layout widths, custom aspect ratios, and visual depth.

Lucide React: Integrated clean, customizable SVG icons to enhance usability and provide modern visual cues.

APIs & Data Fetching

OpenWeatherMap API: Consumed multiple endpoints (Direct Geocoding, Current Weather, and 5-Day/3-Hour Forecast) using asynchronous JavaScript (async/await) and safe data-extraction patterns (Optional Chaining ?.).

Tooling & Deployment

Vite: Used as the next-generation build tool for lightning-fast development, asset optimization, and compiling production-ready static files.

GitHub Pages: Configured automated deployment pipelines to host the static production build directly from the repository.

💡 Technical Challenges & Learnings

1. Client-Side Routing on Static Hosts (GitHub Pages)

Challenge: Standard browser routing (BrowserRouter) frequently triggers 404 Not Found errors on static file hosts when a user reloads an internal route like /favorites.

Solution: Transitioned the routing system to HashRouter, which utilizes the URL hash (#) to keep route changes internal to the client, preventing unnecessary server-side requests and guaranteeing 100% routing stability on GitHub Pages.

2. API Response Cleaning & Data Mapping

Challenge: The forecast API returns a massive array of 40 data points spaced every 3 hours, which is too dense to display on a clean dashboard.

Solution: Wrote a custom utility function in JS to group 3-hour intervals into 5 distinct calendar days, dynamically calculating the absolute minimum and maximum temperatures for each day while discarding redundant data.
