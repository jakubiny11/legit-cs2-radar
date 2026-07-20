import { useRef } from "react";
import { getRadarPosition, teamEnum } from "../utilities/utilities";

const Bomb = ({ bombData, mapData, radarImage, localTeam, settings }) => {
  const radarPosition = getRadarPosition(mapData, bombData);

  const bombRef = useRef();
  const bombBounding = (bombRef.current &&
    bombRef.current.getBoundingClientRect()) || { width: 0, height: 0 };

  const radarImageBounding = (radarImage !== undefined &&
    radarImage.getBoundingClientRect()) || { width: 0, height: 0 };
  const radarImageTranslation = {
    x: radarImageBounding.width * radarPosition.x - bombBounding.width * 0.5,
    y: radarImageBounding.height * radarPosition.y - bombBounding.height * 0.5,
  };

  // Calculate bomb size based on settings
  const baseSize = 1.6;
  const scaledSize = baseSize * (settings.bombSize || 0.5);

  const isPlanted = bombData.m_blow_time > 0 && !bombData.m_is_defused;

  return (
    <div
      className={`absolute origin-center rounded-full left-0 top-0 pointer-events-none transition-transform duration-100 ${isPlanted ? "animate-bomb-pulse" : ""}`}
      ref={bombRef}
      style={{
        width: `${scaledSize}vw`,
        height: `${scaledSize}vw`,
        transform: `translate(${radarImageTranslation.x}px, ${radarImageTranslation.y}px)`,
        backgroundColor: bombData.m_is_defused
          ? "#10b981"
          : isPlanted
          ? "#ef4444"
          : "#f59e0b",
        WebkitMask: `url('./assets/icons/c4_sml.png') no-repeat center / contain`,
        zIndex: 20,
        boxShadow: isPlanted ? "0 0 15px #ef4444" : "0 0 8px #f59e0b",
      }}
    />
  );
};

export default Bomb;
