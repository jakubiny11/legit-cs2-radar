import ReactDOM from "react-dom/client";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import PlayerCard from "./components/PlayerCard";
import Radar from "./components/Radar";
import SettingsButton from "./components/settings";
import MaskedIcon from "./components/maskedicon";

const CONNECTION_TIMEOUT = 5000;

/* change this to '1' if you want to use offline (your own pc only) */
const USE_LOCALHOST = 0;

/* you can get your public ip from https://ipinfo.io/ip */
const PUBLIC_IP = "your ip goes here".trim();
const PORT = 22006;

const EFFECTIVE_IP = USE_LOCALHOST ? "localhost" : PUBLIC_IP.match(/[a-zA-Z]/) ? window.location.hostname : PUBLIC_IP;

const DEFAULT_SETTINGS = {
  dotSize: 1,
  bombSize: 1,
  showNames: true,
  showViewCones: true,
  showDeadPlayers: true,
};

const loadSettings = () => {
  const savedSettings = localStorage.getItem("radarSettings");
  return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
};

// In-memory cache for map configuration data to prevent repeating HTTP fetches
const mapCache = {};

const App = () => {
  const [playerArray, setPlayerArray] = useState([]);
  const [mapData, setMapData] = useState();
  const [localTeam, setLocalTeam] = useState();
  const [bombData, setBombData] = useState();
  const [settings, setSettings] = useState(loadSettings());
  const [isConnected, setIsConnected] = useState(false);
  const currentMapRef = useRef(null);

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("radarSettings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const fetchData = async () => {
      let webSocket = null;
      let webSocketURL = null;
      let connectionTimeout = null;

      if (PUBLIC_IP.startsWith("192.168")) {
        const msgEl = document.getElementsByClassName("radar_message")[0];
        if (msgEl) {
          msgEl.textContent = `A public IP address is required! Currently detected IP (${PUBLIC_IP}) is a private/local IP`;
        }
        return;
      }

      if (!webSocket) {
        try {
          if (USE_LOCALHOST) {
            webSocketURL = `ws://localhost:${PORT}/cs2_webradar`;
          } else {
            webSocketURL = `ws://${EFFECTIVE_IP}:${PORT}/cs2_webradar`;
          }

          if (!webSocketURL) return;
          webSocket = new WebSocket(webSocketURL);
        } catch (error) {
          const msgEl = document.getElementsByClassName("radar_message")[0];
          if (msgEl) msgEl.textContent = `${error}`;
        }
      }

      connectionTimeout = setTimeout(() => {
        webSocket?.close();
      }, CONNECTION_TIMEOUT);

      webSocket.onopen = async () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        console.info("connected to the web socket");
      };

      webSocket.onclose = async () => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        console.error("disconnected from the web socket");
      };

      webSocket.onerror = async (error) => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        const msgEl = document.getElementsByClassName("radar_message")[0];
        if (msgEl) {
          msgEl.textContent = `WebSocket connection to '${webSocketURL}' failed. Please check IP address and server state.`;
        }
        console.error(error);
      };

      webSocket.onmessage = async (event) => {
        const parsedData = JSON.parse(await event.data.text());
        setPlayerArray(parsedData.m_players || []);
        setLocalTeam(parsedData.m_local_team);
        setBombData(parsedData.m_bomb);

        const map = parsedData.m_map;
        if (map && map !== "invalid" && map !== currentMapRef.current) {
          currentMapRef.current = map;
          if (!mapCache[map]) {
            try {
              const res = await fetch(`data/${map}/data.json`);
              const data = await res.json();
              mapCache[map] = { ...data, name: map };
            } catch (err) {
              console.error(`Failed to load map data for ${map}`, err);
            }
          }
          if (mapCache[map]) {
            setMapData(mapCache[map]);
            document.body.style.backgroundImage = `url(./data/${map}/background.png)`;
          }
        }
      };
    };

    fetchData();
  }, []);

  const tPlayers = playerArray.filter((p) => p.m_team === 2);
  const ctPlayers = playerArray.filter((p) => p.m_team === 3);
  const aliveT = tPlayers.filter((p) => !p.m_is_dead).length;
  const aliveCT = ctPlayers.filter((p) => !p.m_is_dead).length;

  const isC4Planted = bombData && bombData.m_blow_time > 0 && !bombData.m_is_defused;
  const blowTimeLeft = bombData?.m_blow_time || 0;
  const defuseTimeLeft = bombData?.m_defuse_time || 0;
  const isDefusing = bombData?.m_is_defusing;
  const canDefuseInTime = isDefusing && blowTimeLeft - defuseTimeLeft > 0;

  return (
    <div
      className="w-screen h-screen flex flex-col relative overflow-hidden bg-slate-950 text-slate-100"
      style={{
        background: `radial-gradient(60% 60% at 50% 50%, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.98) 100%)`,
        backdropFilter: `blur(10px)`,
      }}
    >
      {/* Top Header HUD Bar */}
      <header className="w-full glass-panel px-6 py-3 flex items-center justify-between z-40 border-b border-slate-800/60 shadow-lg">
        {/* Left: Map Badge & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 px-3 py-1.5 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-sm tracking-wider uppercase text-slate-200">
              {mapData?.name ? mapData.name.replace("de_", "").replace("cs_", "") : "CS2 RADAR"}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            {isConnected ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                ● Live Feed
              </span>
            ) : (
              <span className="text-amber-400">Waiting for connection...</span>
            )}
          </div>
        </div>

        {/* Center: C4 Bomb Widget */}
        {isC4Planted && (
          <div className="flex flex-col items-center justify-center bg-rose-950/80 border border-rose-700/60 px-5 py-1.5 rounded-2xl shadow-xl animate-pulse">
            <div className="flex items-center gap-2">
              <MaskedIcon
                path="./assets/icons/c4_sml.png"
                height={22}
                color={canDefuseInTime ? "bg-emerald-400" : isDefusing ? "bg-rose-500" : "bg-amber-400"}
              />
              <span className="font-mono font-extrabold text-lg tracking-wider text-slate-100">
                {blowTimeLeft.toFixed(1)}s
              </span>
              {isDefusing && (
                <span className={`text-xs font-mono font-bold ${canDefuseInTime ? "text-emerald-400" : "text-rose-400"}`}>
                  ({defuseTimeLeft.toFixed(1)}s DEFUSE)
                </span>
              )}
            </div>
            {/* C4 Countdown Progress Bar */}
            <div className="w-32 h-1 bg-rose-900/60 rounded-full mt-1 overflow-hidden border border-rose-800/40">
              <div
                className={`h-full transition-all duration-100 ${canDefuseInTime ? "bg-emerald-400" : "bg-rose-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, (blowTimeLeft / 40) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Right: Team Scores & Settings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/50 px-3.5 py-1 rounded-xl text-xs font-bold font-mono">
            <span className="text-amber-400">T: {aliveT}/{tPlayers.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400">CT: {aliveCT}/{ctPlayers.length}</span>
          </div>
          <SettingsButton settings={settings} onSettingsChange={setSettings} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full h-full flex justify-between items-center px-6 py-4 relative overflow-hidden">
        {/* Left Side: Terrorist Players */}
        <ul id="terrorist" className="lg:flex hidden flex-col gap-3.5 z-30 max-h-[85vh] overflow-y-auto pr-2">
          {tPlayers.map((player) => (
            <PlayerCard
              isOnRightSide={false}
              key={player.m_idx}
              playerData={player}
            />
          ))}
        </ul>

        {/* Center: Radar Canvas */}
        <div className="flex-1 flex justify-center items-center h-full relative z-20">
          {(playerArray.length > 0 && mapData && (
            <Radar
              playerArray={playerArray}
              radarImage={`./data/${mapData.name}/${mapData.image || "radar.png"}`}
              mapData={mapData}
              localTeam={localTeam}
              bombData={bombData}
              settings={settings}
            />
          )) || (
            <div id="radar" className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-2xl border border-slate-700/50">
              <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <h1 className="radar_message text-slate-300 font-medium text-sm text-center">
                Waiting for data from game...
              </h1>
            </div>
          )}
        </div>

        {/* Right Side: Counter-Terrorist Players */}
        <ul id="counterTerrorist" className="lg:flex hidden flex-col gap-3.5 z-30 max-h-[85vh] overflow-y-auto pl-2">
          {ctPlayers.map((player) => (
            <PlayerCard
              isOnRightSide={true}
              key={player.m_idx}
              playerData={player}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
