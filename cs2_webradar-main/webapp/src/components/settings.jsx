import { useState } from "react";

const SettingsButton = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="z-50 relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel hover:bg-slate-800/80 transition-all border border-slate-700/50 shadow-lg text-slate-200 text-sm font-medium"
      >
        <img className="w-4 h-4 opacity-90 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} src="./assets/icons/cog.svg" alt="Settings" />
        <span>Radar Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl p-5 shadow-2xl border border-slate-700/60 z-50 text-slate-100">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Radar Preferences
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs">✕</button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sliders */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 font-medium">Player Icon Size</span>
                <span className="text-sky-400 font-mono font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">{settings.dotSize || 1}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.dotSize || 1}
                onChange={(e) => onSettingsChange({ ...settings, dotSize: parseFloat(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-400 bg-slate-700/60"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 font-medium">Bomb Icon Size</span>
                <span className="text-amber-400 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">{settings.bombSize || 0.5}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.bombSize || 0.5}
                onChange={(e) => onSettingsChange({ ...settings, bombSize: parseFloat(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-400 bg-slate-700/60"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-700/40 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-300 font-medium group-hover:text-slate-100 transition-colors">Show Player Names</span>
                <input
                  type="checkbox"
                  checked={settings.showNames !== false}
                  onChange={(e) => onSettingsChange({ ...settings, showNames: e.target.checked })}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-300 font-medium group-hover:text-slate-100 transition-colors">Show View Cones (FOV)</span>
                <input
                  type="checkbox"
                  checked={settings.showViewCones !== false}
                  onChange={(e) => onSettingsChange({ ...settings, showViewCones: e.target.checked })}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-300 font-medium group-hover:text-slate-100 transition-colors">Show Dead Players</span>
                <input
                  type="checkbox"
                  checked={settings.showDeadPlayers !== false}
                  onChange={(e) => onSettingsChange({ ...settings, showDeadPlayers: e.target.checked })}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
