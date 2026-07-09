import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ** API KEY reutilized **
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Auxiliary function to handle API errors
const handleApiError = (response) => {
    if (response.status === 401) {
        throw new Error(`Error 401: Invalid API Key. Check your OWM key.`);
    }
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
};

// Auxiliary function to get the icon URL
const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const CityDetailPage = () => {
    // 1. Get the city name from the URL
    const { cityName } = useParams();
    const navigate = useNavigate();

    // 2. States to manage data
    const [cityData, setCityData] = useState(null); 
    const [weatherData, setWeatherData] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FUNCTION PHASE 2: Get Weather using Coordinates ---
    const fetchWeather = useCallback(async (lat, lon) => {
        // Use the API endpoint for 5-day/3-hour forecast
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;
        
        try {
            const response = await fetch(weatherUrl);
            handleApiError(response);
            
            const data = await response.json();
            setWeatherData(data); 
        } catch (err) {
            setError(`Fail at getting the forecast: ${err.message}`);
        }
    }, []); 

    // --- FUNCTION PHASE 1: Get Coordinates and then Weather ---
    const fetchCoordinatesAndWeather = useCallback(async () => {
        if (!cityName) {
            setError("Error: Not city name specified.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCityData(null); 
        setWeatherData(null); 
        
        // Decode the city name in case it has spaces (e.g., "New%20York")
        const decodedCityName = decodeURIComponent(cityName);

        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${decodedCityName}&limit=1&appid=${API_KEY}`;
        
        try {
            // PHASE 1: Get Coordinates
            const coordResponse = await fetch(geocodingUrl);
            handleApiError(coordResponse);
            
            const coordData = await coordResponse.json();
            
            if (coordData.length === 0) {
                throw new Error(`No did not found results for: ${decodedCityName}`);
            }

            const result = coordData[0];
            const newCityData = {
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                country: result.country
            };
            setCityData(newCityData);
            
            // PHASE 2: Call the weather function
            await fetchWeather(newCityData.lat, newCityData.lon);

        } catch (err) {
            console.error("Error in the detail page view:", err);
            setError(`Error loading the city: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [cityName, fetchWeather]); 

    // 3. Run the function when the component loads or when the city changes
    useEffect(() => {
        fetchCoordinatesAndWeather();
    }, [fetchCoordinatesAndWeather]); 
    
    // This function takes the 3-hour forecast list and returns an array of daily forecasts with max and min temperatures
    const getDailyForecast = (forecastList) => {
        const dailyData = {}; // wE'll use an object to group by date
        
        forecastList.forEach(item => {
            // Format the date to YYYY-MM-DD
            const date = item.dt_txt.split(' ')[0]; 
            const temp = item.main.temp;
            const description = item.weather[0].description;
            const icon = item.weather[0].icon;

            if (!dailyData[date]) {
                // If it's the first data point of the day, initialize it
                dailyData[date] = {
                    min: temp,
                    max: temp,
                    description: description,
                    icon: icon,
                    timestamp: item.dt // Save the timestamp for sorting later
                };
            } else {
                // Update min and max temperatures for the day
                dailyData[date].min = Math.min(dailyData[date].min, temp);
                dailyData[date].max = Math.max(dailyData[date].max, temp);
            }
        });
        
        // Convert the object to an array and sort by date, then return only the first 5 days
        return Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp).slice(0, 5);
    };

    // --- Rendering ---

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center text-blue-600">
                    <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">...</svg>
                    <p className="text-xl font-medium">Loading forecast for {cityName}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg border-l-4 border-red-500 text-red-700">
                    <p className="text-2xl font-bold mb-4">Error at loading the detail page</p>
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Get back to the Search
                    </button>
                </div>
            </div>
        );
    }

    const dailyForecasts = weatherData ? getDailyForecast(weatherData.list) : [];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <button 
                    onClick={() => navigate('/')}
                    className="mb-8 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                    &larr; Get back to the Search
                </button>
                
                <h1 className="text-5xl font-extrabold text-gray-900 text-center mb-4">
                    {cityData?.name || decodeURIComponent(cityName)}, {cityData?.country}
                </h1>
                <p className="text-xl text-gray-500 text-center mb-12">
                    5-Day Forecast 
               </p>

                {/* Grid for Daily Forecasts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    {dailyForecasts.map((day, index) => (
                        <div 
                            key={index} 
                            className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-blue-500 flex flex-col items-center transform hover:scale-[1.03] transition duration-200"
                        >
                            <h3 className="text-lg font-bold text-gray-700 mb-4">
                                {/* Use Intl.DateTimeFormat to display the day of the week */}
                                {new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(new Date(day.timestamp * 1000))}
                            </h3>
                            
                            <img 
                                src={getWeatherIconUrl(day.icon)} 
                                alt={day.description} 
                                className="w-16 h-16"
                            />
                            
                            <p className="text-3xl font-extrabold text-blue-600 mt-2 mb-1">
                                {Math.round(day.max)}°C
                            </p>
                            <p className="text-xl font-semibold text-gray-400">
                                {Math.round(day.min)}°C
                            </p>
                            <p className="text-sm text-gray-600 capitalize mt-3 text-center">
                                {day.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Show the city's time to demonstrate additional data */}
                <div className="mt-12 text-center text-gray-600 border-t pt-6">
                    <p>Data provided by OpenWeatherMap.</p>
                </div>
            </div>
        </div>
    );
};

export default CityDetailPage;