import { useRef, useState, useEffect } from "react";
import { getRadarPosition, playerColors } from "../utilities/utilities";

let playerRotations = [];
const calculatePlayerRotation = (playerData) => {
  // CS2 yaw angle: 90 = North (Up), 0 = East (Right), -90 = South (Down), 180/-180 = West (Left)
  // Teardrop dot at 0 deg rotation points UP (North).
  // Therefore: playerRotation = 90 - m_eye_angle
  const targetAngle = 90 - (playerData.m_eye_angle || 0);
  const idx = playerData.m_idx;

  playerRotations[idx] = (playerRotations[idx] || 0) % 360;
  playerRotations[idx] +=
    ((targetAngle - playerRotations[idx] + 540) % 360) - 180;

  return playerRotations[idx];
};

const Player = ({
  playerData,
  mapData,
  radarImage,
  localTeam,
  settings,
  isEnlarged,
  isFollowing,
  onSingleClickPlayer,
  onDoubleClickPlayer
}) => {
  const [lastKnownPosition, setLastKnownPosition] = useState(null);
  const radarPosition = getRadarPosition(mapData, playerData.m_position) || { x: 0, y: 0 };
  const invalidPosition = radarPosition.x <= 0 && radarPosition.y <= 0;

  const playerRef = useRef();
  const playerBounding = (playerRef.current &&
    playerRef.current.getBoundingClientRect()) || { width: 0, height: 0 };
  const playerRotation = calculatePlayerRotation(playerData);

  const radarImageBounding = (radarImage !== undefined &&
    radarImage.getBoundingClientRect()) || { width: 0, height: 0 };

  const baseMultiplier = isEnlarged || isFollowing ? 1.65 : 0.85;
  const scaledSize = baseMultiplier * (settings.dotSize || 1);

  // Store last known position when dead
  useEffect(() => {
    if (playerData.m_is_dead) {
      if (!lastKnownPosition) {
        setLastKnownPosition(radarPosition);
      }
    } else {
      setLastKnownPosition(null);
    }
  }, [playerData.m_is_dead, radarPosition, lastKnownPosition]);

  if (playerData.m_is_dead && settings.showDeadPlayers === false) {
    return null;
  }

  const effectivePosition = playerData.m_is_dead ? lastKnownPosition || { x: 0, y: 0 } : radarPosition;

  const radarImageTranslation = {
    x: radarImageBounding.width * effectivePosition.x - playerBounding.width * 0.5,
    y: radarImageBounding.height * effectivePosition.y - playerBounding.height * 0.5,
  };

  const isTeammate = playerData.m_team === localTeam;
  const dotColor = isTeammate
    ? playerColors[playerData.m_color] || "#38bdf8"
    : "#ef4444";

  return (
    <div
      className="absolute origin-center left-0 top-0 cursor-pointer"
      ref={playerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSingleClickPlayer && onSingleClickPlayer(playerData.m_idx);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClickPlayer && onDoubleClickPlayer(playerData.m_idx);
      }}
      style={{
        width: `${scaledSize}vw`,
        height: `${scaledSize}vw`,
        transform: `translate(${radarImageTranslation.x}px, ${radarImageTranslation.y}px)`,
        transition: `transform 120ms cubic-bezier(0.16, 1, 0.3, 1), width 200ms ease, height 200ms ease`,
        zIndex: isFollowing ? 30 : isEnlarged ? 25 : playerData.m_is_dead ? 1 : 10,
      }}
    >
      {/* View Cone (Authentic 90-degree FOV Circular Sector Fan) */}
      {!playerData.m_is_dead && settings.showViewCones !== false && !invalidPosition && (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, -100%) rotate(${playerRotation}deg)`,
            transformOrigin: "bottom center",
            width: `${scaledSize * (isEnlarged ? 4.5 : 3.8)}vw`,
            height: `${scaledSize * (isEnlarged ? 4.5 : 3.8)}vw`,
            background: `conic-gradient(from 315deg at 50% 100%, transparent 0deg, ${dotColor}66 45deg, transparent 90deg)`,
            WebkitMaskImage: `radial-gradient(circle at 50% 100%, black 0%, black 65%, transparent 100%)`,
            maskImage: `radial-gradient(circle at 50% 100%, black 0%, black 65%, transparent 100%)`,
            transition: `transform 120ms cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        />
      )}

      {/* Rotating container for player directional dot */}
      <div
        style={{
          transform: `rotate(${playerData.m_is_dead ? 0 : playerRotation}deg)`,
          width: "100%",
          height: "100%",
          transition: `transform 120ms cubic-bezier(0.16, 1, 0.3, 1)`,
          opacity: playerData.m_is_dead ? 0.6 : invalidPosition ? 0 : 1,
        }}
      >
        {playerData.m_is_dead ? (
          <div
            className="w-full h-full rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-600/60 shadow-md text-xs font-bold text-slate-400"
            style={{
              backgroundImage: `url('./assets/icons/icon-enemy-death_png.png')`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "contain",
            }}
          />
        ) : (
          <div
            className={`w-full h-full rounded-[50%_50%_50%_0%] rotate-[135deg] shadow-lg border transition-all ${
              isFollowing
                ? "border-sky-300 border-2 animate-pulse ring-4 ring-sky-400/40"
                : isEnlarged
                ? "border-amber-300 border-2 ring-4 ring-amber-400/40"
                : "border-white/20"
            }`}
            style={{
              backgroundColor: dotColor,
              boxShadow: isEnlarged || isFollowing
                ? `0 0 16px ${dotColor}`
                : `0 0 10px ${dotColor}aa`,
            }}
          />
        )}
      </div>

      {/* Player Name Badge */}
      {(settings.showNames !== false || isEnlarged || isFollowing) && !playerData.m_is_dead && !invalidPosition && playerData.m_name && (
        <div className={`absolute left-1/2 -bottom-5 transform -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded border text-[9px] font-semibold shadow-md pointer-events-none ${
          isFollowing
            ? "bg-sky-950/90 border-sky-400 text-sky-200"
            : isEnlarged
            ? "bg-amber-950/90 border-amber-400 text-amber-200 font-bold text-[10px]"
            : "bg-slate-950/80 border-slate-700/60 text-slate-200"
        }`}>
          {playerData.m_name}
        </div>
      )}
    </div>
  );
};

export default Player;