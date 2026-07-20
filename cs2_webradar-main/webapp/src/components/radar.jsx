import { useRef, useState } from "react";
import Player from "./player";
import Bomb from "./bomb";

const Radar = ({
  playerArray,
  radarImage,
  mapData,
  localTeam,
  bombData,
  settings
}) => {
  const radarImageRef = useRef();
  const containerRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click drag
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden origin-center select-none rounded-3xl shadow-2xl border border-slate-700/50 group"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Floating Control Dock */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5 glass-panel p-1.5 rounded-xl border border-slate-700/60 shadow-lg opacity-85 hover:opacity-100 transition-opacity">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors"
        >
          -
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset View"
          className="px-2 h-7 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
        >
          ⛶
        </button>
        <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Radar Map & Entities Layer */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transition: isDragging ? "none" : "transform 150ms ease-out",
          transformOrigin: "center center",
        }}
      >
        <img
          ref={radarImageRef}
          className="w-full h-auto pointer-events-none display-block rounded-2xl"
          src={radarImage}
          alt="Map Radar"
        />

        {playerArray.map((player) => (
          <Player
            key={player.m_idx}
            playerData={player}
            mapData={mapData}
            radarImage={radarImageRef.current}
            localTeam={localTeam}
            settings={settings}
          />
        ))}

        {bombData && (
          <Bomb
            bombData={bombData}
            mapData={mapData}
            radarImage={radarImageRef.current}
            localTeam={localTeam}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
};

export default Radar;
