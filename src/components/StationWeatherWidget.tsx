import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Eye, 
  Compass, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  MapPin, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { AppTheme, StationBalance } from '../types';

interface StationWeatherWidgetProps {
  theme?: AppTheme;
  stationBalances: StationBalance[];
  onNavigateToAudit?: () => void;
}

interface StationWeatherData {
  station: string;
  city: string;
  region: string;
  elevationMeters: number;
  tempC: number;
  condition: 'Clear' | 'Sunny' | 'Partly Cloudy' | 'Rain Showers' | 'Thunderstorm' | 'Dense Fog / Smog' | 'Overcast';
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  windDirection: string;
  pressureHpa: number;
  visibilityKm: number;
  uvIndex: number;
  advisoryLevel: 'optimal' | 'caution' | 'warning';
  operationalAdvisory: string;
  forecast: {
    day: string;
    tempHigh: number;
    tempLow: number;
    condition: string;
    rainChance: number;
  }[];
}

const STATION_WEATHER_DATA: Record<string, StationWeatherData> = {
  'SWAT 1': {
    station: 'SWAT 1',
    city: 'Mingora',
    region: 'Swat Valley, KP',
    elevationMeters: 984,
    tempC: 22.4,
    condition: 'Sunny',
    feelsLikeC: 22.8,
    humidity: 48,
    windSpeedKmh: 9.5,
    windDirection: 'NNW',
    pressureHpa: 1014,
    visibilityKm: 12.0,
    uvIndex: 6,
    advisoryLevel: 'optimal',
    operationalAdvisory: 'Dry & stable valley weather. Ideal conditions for fuel tanker decanting and pump meter calibration.',
    forecast: [
      { day: 'Today', tempHigh: 24, tempLow: 14, condition: 'Sunny', rainChance: 10 },
      { day: 'Tomorrow', tempHigh: 23, tempLow: 13, condition: 'Partly Cloudy', rainChance: 25 },
      { day: 'Fri', tempHigh: 20, tempLow: 12, condition: 'Rain Showers', rainChance: 65 },
    ],
  },
  'SWAT 2': {
    station: 'SWAT 2',
    city: 'Saidu Sharif',
    region: 'Swat Valley, KP',
    elevationMeters: 968,
    tempC: 21.8,
    condition: 'Partly Cloudy',
    feelsLikeC: 22.1,
    humidity: 52,
    windSpeedKmh: 8.2,
    windDirection: 'N',
    pressureHpa: 1015,
    visibilityKm: 10.5,
    uvIndex: 5,
    advisoryLevel: 'optimal',
    operationalAdvisory: 'Mild mountain air. Underground storage tanks temperature stable at 18°C. No vapor expansion loss expected.',
    forecast: [
      { day: 'Today', tempHigh: 23, tempLow: 13, condition: 'Partly Cloudy', rainChance: 15 },
      { day: 'Tomorrow', tempHigh: 22, tempLow: 12, condition: 'Scattered Clouds', rainChance: 30 },
      { day: 'Fri', tempHigh: 19, tempLow: 11, condition: 'Rain Showers', rainChance: 70 },
    ],
  },
  'MARDAN': {
    station: 'MARDAN',
    city: 'Mardan',
    region: 'Peshawar Basin, KP',
    elevationMeters: 285,
    tempC: 31.2,
    condition: 'Clear',
    feelsLikeC: 33.0,
    humidity: 41,
    windSpeedKmh: 14.1,
    windDirection: 'W',
    pressureHpa: 1009,
    visibilityKm: 9.0,
    uvIndex: 8,
    advisoryLevel: 'caution',
    operationalAdvisory: 'High daytime temperatures. Recommend scheduling heavy tanker decanting after 6:00 PM to minimize vapor loss.',
    forecast: [
      { day: 'Today', tempHigh: 33, tempLow: 21, condition: 'Clear', rainChance: 5 },
      { day: 'Tomorrow', tempHigh: 34, tempLow: 22, condition: 'Sunny', rainChance: 10 },
      { day: 'Fri', tempHigh: 31, tempLow: 20, condition: 'Windy / Dust', rainChance: 20 },
    ],
  },
  'PESHAWAR': {
    station: 'PESHAWAR',
    city: 'Peshawar',
    region: 'G.T. Road Corridor, KP',
    elevationMeters: 359,
    tempC: 29.8,
    condition: 'Partly Cloudy',
    feelsLikeC: 31.5,
    humidity: 46,
    windSpeedKmh: 11.8,
    windDirection: 'SW',
    pressureHpa: 1010,
    visibilityKm: 8.5,
    uvIndex: 7,
    advisoryLevel: 'optimal',
    operationalAdvisory: 'Heavy highway traffic humidity normal. Daily dispenser nozzle flow rates within calibrated tolerances.',
    forecast: [
      { day: 'Today', tempHigh: 32, tempLow: 20, condition: 'Partly Cloudy', rainChance: 10 },
      { day: 'Tomorrow', tempHigh: 33, tempLow: 21, condition: 'Clear', rainChance: 15 },
      { day: 'Fri', tempHigh: 30, tempLow: 19, condition: 'Overcast', rainChance: 40 },
    ],
  },
  'ISLAMABAD': {
    station: 'ISLAMABAD',
    city: 'Islamabad / Rawalpindi',
    region: 'Federal Capital Territory',
    elevationMeters: 540,
    tempC: 26.5,
    condition: 'Rain Showers',
    feelsLikeC: 27.2,
    humidity: 78,
    windSpeedKmh: 16.4,
    windDirection: 'E',
    pressureHpa: 1011,
    visibilityKm: 6.0,
    uvIndex: 4,
    advisoryLevel: 'warning',
    operationalAdvisory: 'Precipitation Alert: Mandatory water-find paste dip rod test on underground tanks before and after fuel decanting.',
    forecast: [
      { day: 'Today', tempHigh: 27, tempLow: 18, condition: 'Rain Showers', rainChance: 80 },
      { day: 'Tomorrow', tempHigh: 26, tempLow: 17, condition: 'Thunderstorm', rainChance: 65 },
      { day: 'Fri', tempHigh: 28, tempLow: 18, condition: 'Scattered Clouds', rainChance: 25 },
    ],
  },
};

export const StationWeatherWidget: React.FC<StationWeatherWidgetProps> = ({
  theme = 'iphone-dark',
  stationBalances,
  onNavigateToAudit,
}) => {
  const isLight = theme === 'iphone-light';
  const availableStations = stationBalances.length > 0 
    ? stationBalances.map(s => s.station)
    : Object.keys(STATION_WEATHER_DATA);

  const [selectedStation, setSelectedStation] = useState<string>(availableStations[0] || 'SWAT 1');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Sync selectedStation if balance list changes
  useEffect(() => {
    if (availableStations.length > 0 && !availableStations.includes(selectedStation)) {
      setSelectedStation(availableStations[0]);
    }
  }, [availableStations, selectedStation]);

  const weather = STATION_WEATHER_DATA[selectedStation] || STATION_WEATHER_DATA['SWAT 1'];

  const convertTemp = (degC: number) => {
    if (unit === 'F') {
      return Math.round((degC * 9) / 5 + 32);
    }
    return degC.toFixed(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond) {
      case 'Sunny':
      case 'Clear':
        return <Sun className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'Rain Showers':
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case 'Thunderstorm':
        return <CloudLightning className="w-8 h-8 text-indigo-400" />;
      case 'Overcast':
      case 'Dense Fog / Smog':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      default:
        return <Cloud className="w-8 h-8 text-cyan-300" />;
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/40'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900/20 via-cyan-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight">
                Live Atmospheric & Station Weather Radar
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Microclimate conditions, evaporation monitoring & decanting safety alerts
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Temperature Unit Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-inherit bg-slate-950/40 text-xs">
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                unit === 'C' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                unit === 'F' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Radar Button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Sync live atmospheric station sensor"
            className="p-2 rounded-xl border border-inherit hover:bg-slate-800/40 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Station Selector Segment Tabs */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-inherit bg-slate-950/30">
        {availableStations.map(stName => {
          const isCurrent = stName === selectedStation;
          const stWeather = STATION_WEATHER_DATA[stName] || STATION_WEATHER_DATA['SWAT 1'];
          return (
            <button
              key={stName}
              type="button"
              onClick={() => setSelectedStation(stName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{stName}</span>
              <span className="text-[10px] opacity-75 font-mono">({stWeather.city})</span>
            </button>
          );
        })}
      </div>

      {/* Main Weather Panel */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: Main Temp & Condition */}
          <div className="md:col-span-5 flex items-center justify-between sm:justify-start gap-5 p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950/60 border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                {getWeatherIcon(weather.condition)}
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
                  {convertTemp(weather.tempC)}°{unit}
                </div>
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  <span>{weather.condition}</span>
                  <span className="text-slate-400">• Feels like {convertTemp(weather.feelsLikeC)}°{unit}</span>
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-mono">
              <div className="font-bold text-slate-200">{weather.city}</div>
              <div>Alt: {weather.elevationMeters}m</div>
            </div>
          </div>

          {/* Right: Telemetry Grid (Humidity, Wind, Pressure, Visibility) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Humidity</span>
              </div>
              <div className="text-base font-bold font-mono text-white">{weather.humidity}%</div>
              <div className="text-[10px] text-slate-400">Dew point normal</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wind</span>
              </div>
              <div className="text-base font-bold font-mono text-white">{weather.windSpeedKmh} <span className="text-xs">km/h</span></div>
              <div className="text-[10px] text-slate-400">{weather.windDirection} Breeze</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pressure</span>
              </div>
              <div className="text-base font-bold font-mono text-white">{weather.pressureHpa} <span className="text-xs">hPa</span></div>
              <div className="text-[10px] text-slate-400">Stable barometer</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visibility</span>
              </div>
              <div className="text-base font-bold font-mono text-white">{weather.visibilityKm} <span className="text-xs">km</span></div>
              <div className="text-[10px] text-slate-400">UV Index: {weather.uvIndex}</div>
            </div>
          </div>
        </div>

        {/* Operational Decanting & Underground Tank Safety Advisory */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            weather.advisoryLevel === 'warning'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              : weather.advisoryLevel === 'caution'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {weather.advisoryLevel === 'warning' ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : weather.advisoryLevel === 'caution' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] mr-1.5">
                Station Fuel Advisory:
              </span>
              <span>{weather.operationalAdvisory}</span>
            </div>
          </div>

          {onNavigateToAudit && (
            <button
              type="button"
              onClick={onNavigateToAudit}
              className="text-xs font-bold underline shrink-0 hover:opacity-80 cursor-pointer self-end sm:self-auto"
            >
              Verify Dip Rod Log
            </button>
          )}
        </div>

        {/* 3-Day Forecast Strip */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>3-Day Regional Logistics Outlook</span>
            <span className="text-slate-500 font-normal">Updated {lastRefreshed}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            {weather.forecast.map((fc, i) => (
              <div
                key={i}
                className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-2xl text-center space-y-1"
              >
                <div className="text-[11px] font-bold text-slate-300">{fc.day}</div>
                <div className="text-sm font-black text-white font-mono">
                  {convertTemp(fc.tempHigh)}° / <span className="text-slate-400 text-xs">{convertTemp(fc.tempLow)}°</span>
                </div>
                <div className="text-[11px] text-cyan-300">{fc.condition}</div>
                <div className="text-[10px] text-slate-400">Rain: {fc.rainChance}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
