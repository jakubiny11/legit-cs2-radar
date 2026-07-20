import { useState, useEffect } from "react";
import MaskedIcon from "./maskedicon";
import { playerColors, teamEnum } from "../utilities/utilities";

const PlayerCard = ({ playerData, isOnRightSide }) => {
  const [modelName, setModelName] = useState(playerData.m_model_name);

  useEffect(() => {
    if (playerData.m_model_name)
      setModelName(playerData.m_model_name);
  }, [playerData.m_model_name]);

  const hpPercent = Math.max(0, Math.min(100, playerData.m_health || 0));
  const hpColorClass = hpPercent > 60
    ? "from-emerald-500 to-teal-400"
    : hpPercent > 25
    ? "from-amber-500 to-yellow-400"
    : "from-rose-600 to-red-500";

  return (
    <li
      style={{ opacity: playerData.m_is_dead ? 0.45 : 1 }}
      className={`glass-card rounded-2xl p-3.5 flex ${isOnRightSide ? "flex-row-reverse" : "flex-row"} gap-4 items-center shadow-xl border border-slate-700/40 hover:border-slate-600/60 transition-all`}
    >
      {/* Avatar & Model Column */}
      <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
        <div
          className="cursor-pointer group flex flex-col items-center"
          onClick={() =>
            playerData.m_steam_id &&
            window.open(
              `https://steamcommunity.com/profiles/${playerData.m_steam_id}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <span className="text-xs font-semibold text-slate-100 group-hover:text-sky-300 transition-colors tracking-wide truncate max-w-[85px] text-center">
            {playerData.m_name || "Player"}
          </span>
          <div
            className="w-2.5 h-2.5 rounded-full mt-1 border border-white/30 shadow"
            style={{
              backgroundColor: playerColors[playerData.m_color] || (isOnRightSide ? "#38bdf8" : "#f59e0b"),
            }}
          />
        </div>

        {modelName && (
          <img
            className={`h-24 object-contain filter drop-shadow-lg transition-transform duration-300 group-hover:scale-105 ${isOnRightSide ? "scale-x-[-1]" : ""}`}
            src={`./assets/characters/${modelName}.png`}
            alt="agent"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Details & Health/Weapons Column */}
      <div className={`flex flex-col ${isOnRightSide ? "items-end" : "items-start"} justify-center gap-2 flex-1 min-w-[170px]`}>
        {/* Money & Team Indicator */}
        <div className={`flex items-center gap-2 w-full ${isOnRightSide ? "justify-end" : "justify-start"}`}>
          <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-md shadow-sm">
            ${playerData.m_money || 0}
          </span>
        </div>

        {/* Health & Armor Progress Bars */}
        <div className="w-full space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 min-w-[45px]">
              <MaskedIcon
                path="./assets/icons/health.svg"
                height={13}
                color="bg-rose-400"
              />
              <span className="font-mono font-bold text-slate-200 text-[11px]">{playerData.m_health}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className={`h-full bg-gradient-to-r ${hpColorClass} transition-all duration-300 rounded-full`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 min-w-[45px]">
              <MaskedIcon
                path={`./assets/icons/${playerData.m_has_helmet ? "kevlar_helmet" : "kevlar"}.svg`}
                height={13}
                color="bg-sky-400"
              />
              <span className="font-mono font-bold text-slate-200 text-[11px]">{playerData.m_armor}</span>
            </div>
            <div className="w-full h-1 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-sky-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, playerData.m_armor || 0))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary & Secondary Weapons */}
        <div className={`flex ${isOnRightSide ? "flex-row-reverse" : "flex-row"} gap-2.5 items-center mt-1`}>
          {playerData.m_weapons?.m_primary && (
            <div className={`p-1.5 rounded-lg border ${playerData.m_weapons.m_active === playerData.m_weapons.m_primary ? "bg-sky-500/20 border-sky-400/50 shadow-md" : "bg-slate-900/50 border-slate-700/30"}`}>
              <MaskedIcon
                path={`./assets/icons/${playerData.m_weapons.m_primary}.svg`}
                height={22}
                color={playerData.m_weapons.m_active === playerData.m_weapons.m_primary ? "bg-sky-300" : "bg-slate-400"}
              />
            </div>
          )}

          {playerData.m_weapons?.m_secondary && (
            <div className={`p-1.5 rounded-lg border ${playerData.m_weapons.m_active === playerData.m_weapons.m_secondary ? "bg-sky-500/20 border-sky-400/50 shadow-md" : "bg-slate-900/50 border-slate-700/30"}`}>
              <MaskedIcon
                path={`./assets/icons/${playerData.m_weapons.m_secondary}.svg`}
                height={20}
                color={playerData.m_weapons.m_active === playerData.m_weapons.m_secondary ? "bg-sky-300" : "bg-slate-400"}
              />
            </div>
          )}
        </div>

        {/* Grenades & Defuser/C4 Items */}
        <div className={`flex ${isOnRightSide ? "flex-row-reverse" : "flex-row"} gap-2 items-center text-xs opacity-90`}>
          {playerData.m_weapons?.m_utilities && playerData.m_weapons.m_utilities.map((utility, idx) => (
            <MaskedIcon
              key={idx}
              path={`./assets/icons/${utility}.svg`}
              height={18}
              color={playerData.m_weapons.m_active === utility ? "bg-sky-300" : "bg-slate-400"}
            />
          ))}

          {playerData.m_team === teamEnum.counterTerrorist && playerData.m_has_defuser && (
            <div className="bg-sky-950/60 p-1 rounded border border-sky-700/40">
              <MaskedIcon
                path="./assets/icons/defuser.svg"
                height={18}
                color="bg-sky-400"
              />
            </div>
          )}

          {playerData.m_team === teamEnum.terrorist && playerData.m_has_bomb && (
            <div className="bg-rose-950/60 p-1 rounded border border-rose-700/40 animate-pulse">
              <MaskedIcon
                path="./assets/icons/c4.svg"
                height={18}
                color="bg-rose-400"
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default PlayerCard;
