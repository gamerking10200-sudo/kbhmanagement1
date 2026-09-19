import React, { useState, useEffect } from 'react';
import { 
  X, 
  Fuel, 
  PlusCircle, 
  Gauge, 
  Layers, 
  Coins, 
  Building2, 
  MapPin, 
  User, 
  Phone,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sliders,
  Database,
  Info,
  Edit3
} from 'lucide-react';
import { AppTheme, StationBalance, TankDetail } from '../types';

interface AddStationModalProps {
  isOpen?: boolean;
  theme?: AppTheme;
  initialStation?: StationBalance | null;
  onClose: () => void;
  onAddStation: (station: StationBalance) => void;
  onUpdateStation?: (station: StationBalance, oldStationName?: string) => void;
  onDeleteStation?: (stationName: string) => void;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen = true,
  theme = 'iphone-dark',
  initialStation = null,
  onClose,
  onAddStation,
  onUpdateStation,
  onDeleteStation,
}) => {
  const isLight = theme === 'iphone-light';
  const isEditMode = Boolean(initialStation);

  // Identity & Contact
  const [stationName, setStationName] = useState(initialStation?.station || '');
  const [location, setLocation] = useState(initialStation?.location || '');
  const [managerInCharge, setManagerInCharge] = useState(initialStation?.managerInCharge || '');
  const [phone, setPhone] = useState(initialStation?.phone || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(initialStation?.status || 'Active');

  // Capital Float
  const [allocatedInvestment, setAllocatedInvestment] = useState(
    initialStation ? initialStation.allocatedInvestment : 2000000
  );
  const [cashOnHand, setCashOnHand] = useState(
    initialStation ? initialStation.cashOnHand : 500000
  );

  // Fuels supported
  const [supportsPetrol, setSupportsPetrol] = useState(initialStation?.supportsPetrol ?? true);
  const [supportsDiesel, setSupportsDiesel] = useState(initialStation?.supportsDiesel ?? true);
  const [supportsHiOctane, setSupportsHiOctane] = useState(
    initialStation?.supportsHiOctane ?? ((initialStation?.hiOctaneCapacity || 0) > 0)
  );

  // Tanks Configuration
  const [typeOfTanks, setTypeOfTanks] = useState(
    initialStation?.typeOfTanks || 'Underground Double-Walled Steel'
  );
  const [tanksCount, setTanksCount] = useState(initialStation?.tanksCount || 3);
  
  // Storage Capacities (Liters)
  const [petrolCapacity, setPetrolCapacity] = useState(initialStation?.petrolCapacity || 10000);
  const [petrolStock, setPetrolStock] = useState(initialStation?.petrolStock || 4500);
  const [dieselCapacity, setDieselCapacity] = useState(initialStation?.dieselCapacity || 10000);
  const [dieselStock, setDieselStock] = useState(initialStation?.dieselStock || 4000);
  const [hiOctaneCapacity, setHiOctaneCapacity] = useState(initialStation?.hiOctaneCapacity || 5000);
  const [hiOctaneStock, setHiOctaneStock] = useState(initialStation?.hiOctaneStock || 1500);
  const [lubesCapacity, setLubesCapacity] = useState(initialStation?.lubesCapacity || 1500);
  const [lubesStock, setLubesStock] = useState(initialStation?.lubesStock || 350);

  // Dispensers & Nozzles
  const [dispensersCount, setDispensersCount] = useState(initialStation?.dispensersCount || 4);
  const [nozzlesCount, setNozzlesCount] = useState(initialStation?.nozzlesCount || 8);

  // View granular tank bays
  const [showTankBays, setShowTankBays] = useState(false);
  const [tankBays, setTankBays] = useState<TankDetail[]>(() => {
    if (initialStation?.tanksDetails && initialStation.tanksDetails.length > 0) {
      return initialStation.tanksDetails;
    }
    // Generate initial bays
    const count = initialStation?.tanksCount || 3;
    const bays: TankDetail[] = [];
    for (let i = 1; i <= count; i++) {
      let fuel: 'Petrol' | 'Diesel' | 'Hi-Octane' = 'Petrol';
      let cap = 10000;
      let stock = 4500;
      if (i === 2) {
        fuel = 'Diesel';
        cap = 10000;
        stock = 4000;
      } else if (i === 3) {
        fuel = 'Hi-Octane';
        cap = 5000;
        stock = 1500;
      }
      bays.push({
        id: `tb-${i}`,
        tankNumber: i,
        fuelType: fuel,
        capacity: cap,
        currentStock: stock,
      });
    }
    return bays;
  });

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  // Synchronize tank bays when tanksCount changes
  const handleTanksCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(12, newCount));
    setTanksCount(validCount);

    setTankBays(prev => {
      const updated = [...prev];
      if (validCount > prev.length) {
        for (let i = prev.length + 1; i <= validCount; i++) {
          updated.push({
            id: `tb-${i}`,
            tankNumber: i,
            fuelType: i % 2 === 0 ? 'Diesel' : 'Petrol',
            capacity: 10000,
            currentStock: 3500,
          });
        }
      } else if (validCount < prev.length) {
        return updated.slice(0, validCount);
      }
      return updated;
    });
  };

  const handleTankBayChange = (index: number, field: keyof TankDetail, value: any) => {
    setTankBays(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Sync totals from granular tank bays
  const syncFromBays = () => {
    let pCap = 0;
    let pStock = 0;
    let dCap = 0;
    let dStock = 0;
    let hoCap = 0;
    let hoStock = 0;

    tankBays.forEach(bay => {
      if (bay.fuelType === 'Petrol') {
        pCap += Number(bay.capacity) || 0;
        pStock += Number(bay.currentStock) || 0;
      } else if (bay.fuelType === 'Diesel') {
        dCap += Number(bay.capacity) || 0;
        dStock += Number(bay.currentStock) || 0;
      } else if (bay.fuelType === 'Hi-Octane') {
        hoCap += Number(bay.capacity) || 0;
        hoStock += Number(bay.currentStock) || 0;
      }
    });

    if (pCap > 0) {
      setSupportsPetrol(true);
      setPetrolCapacity(pCap);
      setPetrolStock(pStock);
    }
    if (dCap > 0) {
      setSupportsDiesel(true);
      setDieselCapacity(dCap);
      setDieselStock(dStock);
    }
    if (hoCap > 0) {
      setSupportsHiOctane(true);
      setHiOctaneCapacity(hoCap);
      setHiOctaneStock(hoStock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) {
      setError('Station Name is required.');
      return;
    }

    const stationPayload: StationBalance = {
      id: initialStation?.id || 'stn-' + Date.now(),
      station: stationName.trim(),
      status,
      allocatedInvestment: Number(allocatedInvestment) || 0,
      cashOnHand: Number(cashOnHand) || 0,
      petrolCapacity: supportsPetrol ? Number(petrolCapacity) || 0 : 0,
      petrolStock: supportsPetrol ? Number(petrolStock) || 0 : 0,
      dieselCapacity: supportsDiesel ? Number(dieselCapacity) || 0 : 0,
      dieselStock: supportsDiesel ? Number(dieselStock) || 0 : 0,
      hiOctaneCapacity: supportsHiOctane ? Number(hiOctaneCapacity) || 0 : 0,
      hiOctaneStock: supportsHiOctane ? Number(hiOctaneStock) || 0 : 0,
      lubesCapacity: Number(lubesCapacity) || 0,
      lubesStock: Number(lubesStock) || 0,
      supportsPetrol,
      supportsDiesel,
      supportsHiOctane,
      typeOfTanks,
      tanksCount: Number(tanksCount) || 1,
      dispensersCount: Number(dispensersCount) || 1,
      nozzlesCount: Number(nozzlesCount) || 1,
      tanksDetails: tankBays,
      managerInCharge: managerInCharge.trim() || 'Unassigned',
      location: location.trim() || 'Main Station Highway',
      phone: phone.trim() || '',
    };

    if (isEditMode && onUpdateStation) {
      onUpdateStation(stationPayload, initialStation?.station);
    } else {
      onAddStation(stationPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!initialStation || !onDeleteStation) return;
    onDeleteStation(initialStation.station);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit sticky top-0 bg-inherit z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                isEditMode
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-blue-600/20 border-blue-500/30 text-blue-500'
              }`}
            >
              {isEditMode ? <Edit3 className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>{isEditMode ? `Edit Gas Station: ${initialStation?.station}` : 'Commission New Gas Station'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  CEO Authority
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEditMode
                  ? 'Update station infrastructure, tanks count, fuel capacities, dispenser units & nozzles'
                  : 'Register tanks, fuel types, dispensers, nozzles & capital float'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Station Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">
                Station Name / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., SWAT 4, SWAT 1, or PCR 3"
                value={stationName}
                onChange={e => setStationName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-850 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">
                Station Operational Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Active')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === 'Active'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Active Station
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Inactive')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === 'Inactive'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Inactive (Paused)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">
                Location / District
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g., Mingora North Bypass, Swat"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-850 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-400">
                Station Manager In-Charge & Phone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={managerInCharge}
                    onChange={e => setManagerInCharge(e.target.value)}
                    className={`w-full pl-8 pr-2 py-2.5 rounded-xl text-xs font-medium border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-850 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="+92 3..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={`w-full pl-8 pr-2 py-2.5 rounded-xl text-xs font-medium border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-850 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capital Float & Cash In Hand */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                Capital Float & Investment
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-400">
                  Allocated Capital Investment (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={allocatedInvestment}
                  onChange={e => setAllocatedInvestment(Number(e.target.value))}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono font-bold border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-400">
                  Drawer Working Float / Cash-in-Hand (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cashOnHand}
                  onChange={e => setCashOnHand(Number(e.target.value))}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm font-mono font-bold border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Fuel Types Supported */}
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-400">
              Fuel Types Commissioned At This Station
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  supportsPetrol
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold'
                    : 'border-inherit opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={supportsPetrol}
                  onChange={e => setSupportsPetrol(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-xs">Petrol (Super)</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  supportsDiesel
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                    : 'border-inherit opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={supportsDiesel}
                  onChange={e => setSupportsDiesel(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span className="text-xs">Diesel (HSD)</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  supportsHiOctane
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                    : 'border-inherit opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={supportsHiOctane}
                  onChange={e => setSupportsHiOctane(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span className="text-xs">Hi-Octane 97</span>
              </label>
            </div>
          </div>

          {/* Underground Tanks & Storage Configuration */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-700/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                  Underground Tanks Configuration & Capacities
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400">Number of Tanks:</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={tanksCount}
                    onChange={e => handleTanksCountChange(Number(e.target.value))}
                    className={`w-16 px-2 py-1 rounded-lg text-xs font-bold text-center border font-mono ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-600'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTankBays(!showTankBays)}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {showTankBays ? 'Hide Individual Bays' : 'Configure Tank Bays'}
                </button>
              </div>
            </div>

            {/* Quick Tanks Selector Presets */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Tanks Quick Presets:</span>
              {[1, 2, 3, 4, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleTanksCountChange(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    tanksCount === num
                      ? 'bg-blue-600 text-white border-blue-500'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {num} {num === 1 ? 'Tank' : 'Tanks'}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1 text-slate-400">
                Tank Construction & Engineering Type
              </label>
              <select
                value={typeOfTanks}
                onChange={e => setTypeOfTanks(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Underground Double-Walled Steel">Underground Double-Walled Steel (UL-58 / 1746)</option>
                <option value="Underground Cylindrical Fiberglass">Underground Cylindrical Fiberglass (FRP / ACT-100)</option>
                <option value="Underground Composite Horizontal">Underground Composite Horizontal Vessel</option>
                <option value="Surface Vertical Skid Tank">Surface Vertical Skid Tank Unit</option>
              </select>
            </div>

            {/* Bulk Fuel Storage Capacities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {supportsPetrol && (
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <div className="flex items-center justify-between font-bold text-blue-400">
                    <span>Petrol Tank(s)</span>
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tank Capacity (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={petrolCapacity}
                      onChange={e => setPetrolCapacity(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Current Dip Stock (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={petrolStock}
                      onChange={e => setPetrolStock(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              )}

              {supportsDiesel && (
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>Diesel Tank(s)</span>
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tank Capacity (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={dieselCapacity}
                      onChange={e => setDieselCapacity(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Current Dip Stock (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={dieselStock}
                      onChange={e => setDieselStock(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              )}

              {supportsHiOctane && (
                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                  <div className="flex items-center justify-between font-bold text-purple-400">
                    <span>Hi-Octane Tank</span>
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tank Capacity (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={hiOctaneCapacity}
                      onChange={e => setHiOctaneCapacity(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Current Dip Stock (Liters):</label>
                    <input
                      type="number"
                      min="0"
                      value={hiOctaneStock}
                      onChange={e => setHiOctaneStock(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Granular Tank Bays Table (Collapsible) */}
            {showTankBays && (
              <div className="mt-4 pt-3 border-t border-inherit space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Individual Underground Tank Bays (1 to {tanksCount})
                  </span>
                  <button
                    type="button"
                    onClick={syncFromBays}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 cursor-pointer"
                  >
                    Sync Totals to Fuel Capacities
                  </button>
                </div>
                <div className="space-y-2">
                  {tankBays.map((bay, idx) => (
                    <div
                      key={bay.id || idx}
                      className={`p-2.5 rounded-xl border grid grid-cols-12 gap-2 items-center text-xs ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="col-span-3 sm:col-span-2 font-bold text-slate-300">
                        Tank #{bay.tankNumber}
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <select
                          value={bay.fuelType}
                          onChange={e => handleTankBayChange(idx, 'fuelType', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-inherit border border-slate-700 text-xs font-bold"
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hi-Octane">Hi-Octane</option>
                          <option value="Lubes">Lubes</option>
                        </select>
                      </div>
                      <div className="col-span-5 sm:col-span-4">
                        <input
                          type="number"
                          placeholder="Capacity (L)"
                          value={bay.capacity}
                          onChange={e => handleTankBayChange(idx, 'capacity', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded bg-inherit border border-slate-700 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Current Stock (L)"
                          value={bay.currentStock}
                          onChange={e => handleTankBayChange(idx, 'currentStock', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded bg-inherit border border-slate-700 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dispensers & Nozzle Island Configuration */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                  Dispensers & Delivery Nozzles Setup
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                {nozzlesCount} Nozzles • {dispensersCount} Pumps
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-400">
                  Number of Dispenser Units (Pumps)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={dispensersCount}
                    onChange={e => setDispensersCount(Math.max(1, Number(e.target.value)))}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold font-mono border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                  {/* Quick dispenser count buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[2, 3, 4, 6, 8].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setDispensersCount(cnt);
                          if (nozzlesCount < cnt * 2) {
                            setNozzlesCount(cnt * 2);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                          dispensersCount === cnt
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'border-inherit text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt} Pumps
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-400">
                  Total Delivery Nozzles (All Fuels)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={nozzlesCount}
                    onChange={e => setNozzlesCount(Math.max(1, Number(e.target.value)))}
                    className={`w-full px-3.5 py-2 rounded-xl text-sm font-bold font-mono border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                  {/* Quick nozzle count buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[4, 6, 8, 12, 16].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setNozzlesCount(cnt)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer ${
                          nozzlesCount === cnt
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'border-inherit text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt} Nozzles
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-inherit flex items-center justify-between text-[11px] text-slate-400">
              <span>Average Density:</span>
              <span className="font-semibold text-slate-300 font-mono">
                {(nozzlesCount / (dispensersCount || 1)).toFixed(1)} Nozzles per Dispenser Pump
              </span>
            </div>
          </div>

          {/* Delete Gas Station Confirmation Banner */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Confirm Decommissioning & Deletion of {stationName}
                  </div>
                  <div className="text-xs text-rose-300/80 mt-0.5">
                    Are you sure you want to permanently delete this gas station from the fleet roster? Historical audit integrity will be archived.
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete Station</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-inherit">
            <div>
              {isEditMode && onDeleteStation && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Station</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all cursor-pointer ${
                  isEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'Save Station Changes' : 'Commission Station'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
