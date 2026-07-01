import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ** CLAVE API: Reutilizamos la misma clave **
const API_KEY = 'acdd42a06d211c22f9c59ab85e650601'; 

// Función auxiliar para manejar errores de la API
const handleApiError = (response) => {
    if (response.status === 401) {
        throw new Error(`Error 401: Invalid API Key. Check your OWM key.`);
    }
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
};

// Función auxiliar para obtener la URL del icono
const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const CityDetailPage = () => {
    // 1. Obtener el nombre de la ciudad de la URL
    const { cityName } = useParams();
    const navigate = useNavigate();

    // 2. Estados para manejar los datos
    const [cityData, setCityData] = useState(null); 
    const [weatherData, setWeatherData] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FUNCIÓN FASE 2: Obtener el Clima usando Coordenadas ---
    const fetchWeather = useCallback(async (lat, lon) => {
        // Usamos la API /forecast de 5 días / 3 horas
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

    // --- FUNCIÓN FASE 1: Obtener Coordenadas y luego el Clima ---
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
        
        // Decodificar el nombre por si tiene espacios (e.g., "New%20York")
        const decodedCityName = decodeURIComponent(cityName);

        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${decodedCityName}&limit=1&appid=${API_KEY}`;
        
        try {
            // FASE 1: Obtener Coordenadas
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
            
            // FASE 2: Llamar a la función de clima
            await fetchWeather(newCityData.lat, newCityData.lon);

        } catch (err) {
            console.error("Error in the detail page view:", err);
            setError(`Error loading the city: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [cityName, fetchWeather]); 

    // 3. Ejecutar la función al cargar el componente o cambiar la ciudad
    useEffect(() => {
        fetchCoordinatesAndWeather();
    }, [fetchCoordinatesAndWeather]); 
    
    // Función para procesar el pronóstico de 3 horas a pronóstico diario (Máx y Mín)
    const getDailyForecast = (forecastList) => {
        const dailyData = {}; // Usaremos un objeto para agrupar por fecha
        
        forecastList.forEach(item => {
            // Formatear la fecha a YYYY-MM-DD
            const date = item.dt_txt.split(' ')[0]; 
            const temp = item.main.temp;
            const description = item.weather[0].description;
            const icon = item.weather[0].icon;

            if (!dailyData[date]) {
                // Si es el primer dato del día
                dailyData[date] = {
                    min: temp,
                    max: temp,
                    description: description,
                    icon: icon,
                    timestamp: item.dt // Guardar el timestamp para ordenar
                };
            } else {
                // Actualizar las temperaturas Máx y Mín
                dailyData[date].min = Math.min(dailyData[date].min, temp);
                dailyData[date].max = Math.max(dailyData[date].max, temp);
            }
        });
        
        // Convertir el objeto a un array y ordenar por fecha
        return Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp).slice(0, 5);
    };

    // --- Renderizado ---

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

                {/* Grid para el Pronóstico Diario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                    {dailyForecasts.map((day, index) => (
                        <div 
                            key={index} 
                            className="bg-white p-6 rounded-xl shadow-xl border-t-4 border-blue-500 flex flex-col items-center transform hover:scale-[1.03] transition duration-200"
                        >
                            <h3 className="text-lg font-bold text-gray-700 mb-4">
                                {/* Usamos Intl.DateTimeFormat para mostrar el día de la semana */}
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

                {/* Mostrar la hora de la ciudad para demostrar datos adicionales */}
                <div className="mt-12 text-center text-gray-600 border-t pt-6">
                    <p>Data provided by OpenWeatherMap.</p>
                </div>
            </div>
        </div>
    );
};

export default CityDetailPage;