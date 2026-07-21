import { useRef, useState } from "react";
import Player from "./player";
import Bomb from "./bomb";
import { getRadarPosition } from "../utilities/utilities";

const Radar = ({
  playerArray,
  radarImage,
  mapData,
  localTeam,
  bombData,
  settings,
  enlargedPlayerIdx,
  followingPlayerIdx,
  onSingleClickPlayer,
  onDoubleClickPlayer,
}) => {
  const radarImageRef = useRef();
  const containerRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotateWithPlayer, setRotateWithPlayer] = useState(true);

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
    if (e.button === 0) {
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

  // Find following player object
  const followingPlayer = followingPlayerIdx !== null
    ? playerArray.find((p) => p.m_idx === followingPlayerIdx)
    : null;

  // Exact math for map rotation & auto-centering when following a player
  let mapRotationDeg = 0;
  let activePanX = panOffset.x;
  let activePanY = panOffset.y;

  if (followingPlayer && !followingPlayer.m_is_dead && rotateWithPlayer) {
    // 1. Calculate map rotation so followed player view angle (eye_angle) faces straight UP (0 deg)
    // In CS2: eye_angle = 90 (North/Up), 0 (East/Right), -90 (South/Down), 180 (West/Left)
    // To turn eye_angle into UP (North), we rotate map by (eye_angle - 90) deg
    mapRotationDeg = (followingPlayer.m_eye_angle || 0) - 90;

    // 2. Auto-center radar view around the followed player position if user is not actively dragging
    if (!isDragging && mapData && radarImageRef.current && containerRef.current) {
      const playerPos = getRadarPosition(mapData, followingPlayer.m_position);
      if (playerPos && playerPos.x > 0 && playerPos.y > 0) {
        const radarW = radarImageRef.current.clientWidth || 0;
        const radarH = radarImageRef.current.clientHeight || 0;
        const containerW = containerRef.current.clientWidth || 0;
        const containerH = containerRef.current.clientHeight || 0;

        if (radarW > 0 && containerW > 0) {
          const playerPxX = radarW * playerPos.x;
          const playerPxY = radarH * playerPos.y;
          const centerContainerX = containerW / 2;
          const centerContainerY = containerH / 2;

          // Pan to bring player to exact center of container
          activePanX = centerContainerX - playerPxX;
          activePanY = centerContainerY - playerPxY;
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden origin-center select-none rounded-3xl shadow-2xl border border-slate-700/50 group w-full h-full flex items-center justify-center"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Floating Control Dock */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5 glass-panel p-1.5 rounded-xl border border-slate-700/60 shadow-lg opacity-90 hover:opacity-100 transition-opacity">
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

        {followingPlayer && (
          <button
            onClick={() => setRotateWithPlayer(!rotateWithPlayer)}
            title="Toggle Map Rotation with Player"
            className={`px-2 h-7 flex items-center justify-center gap-1 rounded-lg text-xs font-bold transition-all ${
              rotateWithPlayer
                ? "bg-sky-500/30 border border-sky-400/60 text-sky-300 shadow-md"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            🔄 Rotate {rotateWithPlayer ? "ON" : "OFF"}
          </button>
        )}

        <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Selected Player HUD Badge Banner */}
      {followingPlayer ? (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-50 glass-panel px-4 py-1.5 rounded-full border border-sky-500/50 shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-100 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span>Following: <strong className="text-sky-300">{followingPlayer.m_name}</strong></span>
          <span className="text-slate-400 text-[10px] font-mono">({Math.round(followingPlayer.m_eye_angle || 0)}°)</span>
        </div>
      ) : enlargedPlayerIdx !== null ? (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-50 glass-panel px-4 py-1.5 rounded-full border border-amber-500/50 shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Enlarged: <strong className="text-amber-300">{playerArray.find(p => p.m_idx === enlargedPlayerIdx)?.m_name || "Player"}</strong></span>
          <span className="text-slate-400 text-[10px]">(Double-click to follow)</span>
        </div>
      ) : null}

      {/* Radar Map & Entities Layer */}
      <div
        style={{
          transform: `translate(${activePanX}px, ${activePanY}px) scale(${zoomLevel}) rotate(${mapRotationDeg}deg)`,
          transition: isDragging ? "none" : "transform 120ms cubic-bezier(0.16, 1, 0.3, 1)",
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
            isEnlarged={player.m_idx === enlargedPlayerIdx}
            isFollowing={player.m_idx === followingPlayerIdx}
            onSingleClickPlayer={onSingleClickPlayer}
            onDoubleClickPlayer={onDoubleClickPlayer}
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
