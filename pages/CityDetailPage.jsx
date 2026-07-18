import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const handleApiError = (response) => {
    if (response.status === 401) {
        throw new Error('Error 401: Invalid API Key. Check your OpenWeatherMap key.');
    }
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
};

const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(timestamp * 1000));
};

const CityDetailPage = () => {
    const { cityName } = useParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [cityData, setCityData] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [currentWeatherData, setCurrentWeatherData] = useState(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWeather = useCallback(async (lat, lon) => {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${API_KEY}`;

        const response = await fetch(weatherUrl);
        handleApiError(response);

        const data = await response.json();
        setWeatherData(data);
    }, []);

    const fetchCurrentWeather = useCallback(async (lat, lon) => {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${API_KEY}`;

        const response = await fetch(currentWeatherUrl);
        handleApiError(response);

        const data = await response.json();
        setCurrentWeatherData(data);
    }, []);

    const fetchCoordinatesAndWeather = useCallback(async () => {
        if (!cityName) {
            setError('Error: No city name provided.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCityData(null);
        setWeatherData(null);
        setCurrentWeatherData(null);
        setSelectedDayIndex(0);
        setHoveredPoint(0);

        const decodedCityName = decodeURIComponent(cityName);
        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${decodedCityName}&limit=1&appid=${API_KEY}`;

        try {
            const coordResponse = await fetch(geocodingUrl);
            handleApiError(coordResponse);

            const coordData = await coordResponse.json();

            if (coordData.length === 0) {
                throw new Error(`No results were found for ${decodedCityName}.`);
            }

            const result = coordData[0];
            const newCityData = {
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                country: result.country
            };
            setCityData(newCityData);

            await Promise.all([
                fetchWeather(newCityData.lat, newCityData.lon),
                fetchCurrentWeather(newCityData.lat, newCityData.lon)
            ]);
        } catch (err) {
            console.error('Error loading city details:', err);
            setError(`Could not load the city: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [cityName, fetchCurrentWeather, fetchWeather]);

    useEffect(() => {
        fetchCoordinatesAndWeather();
    }, [fetchCoordinatesAndWeather]);

    const getDailyForecast = (forecastList) => {
        if (!forecastList?.length) return [];

        const dailyData = {};

        forecastList.forEach((item) => {
            const date = item.dt_txt.split(' ')[0];
            const temp = item.main.temp;
            const description = item.weather[0].description;
            const icon = item.weather[0].icon;
            const entry = {
                temp: Math.round(temp),
                time: new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                }).format(new Date(item.dt * 1000)),
                dt: item.dt
            };

            if (!dailyData[date]) {
                dailyData[date] = {
                    min: temp,
                    max: temp,
                    description,
                    icon,
                    timestamp: item.dt,
                    entries: [entry]
                };
            } else {
                dailyData[date].min = Math.min(dailyData[date].min, temp);
                dailyData[date].max = Math.max(dailyData[date].max, temp);
                dailyData[date].entries.push(entry);
            }
        });

        return Object.values(dailyData)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, 5)
            .map((day) => ({
                ...day,
                label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(day.timestamp * 1000))
            }));
    };

    const dailyForecasts = useMemo(() => {
        return weatherData ? getDailyForecast(weatherData.list) : [];
    }, [weatherData]);

    const selectedDay = dailyForecasts[selectedDayIndex] || dailyForecasts[0];
    const chartData = (selectedDay?.entries || []).slice(0, 8);

    const chartValues = useMemo(() => {
        if (!chartData.length) return { points: [], minTemp: 0, maxTemp: 0, range: 1 };

        const temps = chartData.map((point) => point.temp);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        const range = Math.max(maxTemp - minTemp, 4);
        const paddingX = 4;
        const availableWidth = 100 - paddingX * 2;
        const points = chartData.map((point, index) => {
            const x = paddingX + (index / Math.max(chartData.length - 1, 1)) * availableWidth;
            const normalized = (point.temp - minTemp) / range;
            const y = 90 - normalized * 76;
            return { ...point, x, y };
        });

        return { points, minTemp, maxTemp, range };
    }, [chartData]);

    const activePoint = chartValues.points[hoveredPoint] || chartValues.points[0];
    const linePath = chartValues.points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
    const sunrise = currentWeatherData?.sys?.sunrise;
    const sunset = currentWeatherData?.sys?.sunset;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex items-center text-sky-600">
                    <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-xl font-medium">Loading forecast for {cityName}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg border border-red-500/30 text-red-300">
                    <p className="text-2xl font-bold mb-4">Unable to load the city details</p>
                    <p className="mb-4">{error}</p>
                   <button 
  onClick={() => navigate('/')}
  className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
    isDark 
      ? "bg-white/10 text-slate-300 hover:bg-white/20 border-white/10" 
      : "bg-slate-800 text-white hover:bg-slate-700 border-slate-700 shadow-md"
  }`}
>
                        Back to search
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${
            isDark
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
        } py-12 px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-6xl mx-auto">
                <button 
  onClick={() => navigate('/')}
  className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
    isDark 
      ? "bg-white/10 text-slate-300 hover:bg-white/20 border-white/10" 
      : "bg-slate-800 text-white hover:bg-slate-700 border-slate-700 shadow-md"
  }`}
>
                    &larr; Back to search
                </button>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center mb-3">
                    {cityData?.name || decodeURIComponent(cityName)}, {cityData?.country}
                </h1>
                <p className="text-lg text-slate-400 text-center mb-10">
                    A richer forecast view with a live temperature chart and a detailed daily overview.
                </p>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-6 text-white shadow-xl">
                        <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Now</p>
                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-5xl font-bold">
                                    {Math.round(currentWeatherData?.main?.temp ?? selectedDay?.max ?? 0)}°C
                                </p>
                                <p className="mt-2 text-lg capitalize text-sky-100">
                                    {currentWeatherData?.weather?.[0]?.description || selectedDay?.description}
                                </p>
                            </div>
                            <img
                                src={getWeatherIconUrl(currentWeatherData?.weather?.[0]?.icon)}
                                alt={currentWeatherData?.weather?.[0]?.description || 'Weather icon'}
                                className="w-20 h-20"
                            />
                        </div>
                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-sky-100">
                            <span>Feels like {Math.round(currentWeatherData?.main?.feels_like ?? 0)}°C</span>
                            <span>Humidity {currentWeatherData?.main?.humidity ?? 0}%</span>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Sun cycle</p>
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600">Sunrise</span>
                                <span className="font-semibold text-slate-900">{formatTime(sunrise)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-600">Sunset</span>
                                <span className="font-semibold text-slate-900">{formatTime(sunset)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Condition</span>
                                <span className="font-semibold text-slate-900 capitalize">
                                    {selectedDay?.description || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 overflow-visible rounded-3xl bg-white/10 backdrop-blur-xl p-6 pt-7 shadow-xl border border-white/10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Next 4 days</p>
                            <h2 className="text-2xl font-semibold text-white">Swipe through the upcoming outlook</h2>
                        </div>
                        <p className="text-sm text-slate-400">Tap a day to inspect its hourly pattern</p>
                    </div>

                    <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
                        {dailyForecasts.slice(0, 4).map((day, index) => (
                            <button
                                key={`${day.timestamp}-${index}`}
                                onClick={() => {
                                    setSelectedDayIndex(index);
                                    setHoveredPoint(0);
                                }}
                                className={`min-w-[150px] rounded-2xl border p-4 pt-5 text-left shadow-sm transition-all ${selectedDayIndex === index ? 'border-sky-500 bg-sky-500/20 shadow-md' : 'border-white/10 bg-white/5 hover:border-sky-400/50 hover:bg-white/10'}`}
                            >
                                <p className="text-sm font-semibold text-slate-400">{day.label}</p>
                                <img src={getWeatherIconUrl(day.icon)} alt={day.description} className="my-3 h-14 w-14" />
                                <p className="text-2xl font-bold text-white">{Math.round(day.max)}°</p>
                                <p className="text-sm text-slate-500">{Math.round(day.min)}°</p>
                                <p className="mt-2 text-sm capitalize text-slate-400">{day.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 rounded-3xl bg-white/10 backdrop-blur-xl p-6 shadow-xl border border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Interactive chart</p>
                            <h2 className="text-2xl font-semibold text-white">Temperature through the day</h2>
                        </div>
                        <div className="text-sm text-slate-400">
                            <span className="font-semibold text-white">{selectedDay?.label}</span> • {Math.round(selectedDay?.max)}° / {Math.round(selectedDay?.min)}°
                        </div>
                    </div>

                    {chartValues.points.length > 0 ? (
                        <>
                            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
                                <svg viewBox="0 0 100 100" className="h-56 w-full" preserveAspectRatio="xMidYMid meet">
                                    <line x1="4" y1="90" x2="96" y2="90" stroke="#475569" strokeWidth="0.8" />
                                    <line x1="4" y1="10" x2="4" y2="90" stroke="#475569" strokeWidth="0.8" />
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="#0ea5e9"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {chartValues.points.map((point, index) => (
                                        <g key={`${point.dt}-${index}`}>
                                            <circle cx={point.x} cy={point.y} r="1.8" fill={hoveredPoint === index ? '#22d3ee' : '#38bdf8'} />
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                fill="transparent"
                                                onMouseEnter={() => setHoveredPoint(index)}
                                            />
                                        </g>
                                    ))}
                                </svg>
                                <div className="mt-2 flex text-xs text-slate-500">
                                    {chartValues.points.map((point, index) => (
                                        <span key={`${point.dt}-${index}`} className="flex-1 min-w-0 text-center">
                                            {point.time}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-slate-400">
                                <p className="font-semibold text-white">{activePoint?.time || '—'}</p>
                                <p className="mt-1">
                                    {Math.round(activePoint?.temp ?? 0)}°C • {selectedDay?.description || 'Weather conditions'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="mt-6 text-slate-400">The temperature chart is not available for this city yet.</p>
                    )}
                </div>

                <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-700 pt-6">
                    <p>Weather data provided by OpenWeatherMap.</p>
                </div>
            </div>
        </div>
    );
};

export default CityDetailPage;