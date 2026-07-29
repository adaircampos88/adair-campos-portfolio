"use client";
/* eslint-disable @next/next/no-img-element -- exact exported Figma glyphs are intentionally rendered as local assets */

import {
  Fragment,
  type CSSProperties,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  ChevronRight,
  Pause,
  Play,
  CircleHelp,
  CircleUserRound,
  Cloud,
  CloudSun,
  Clock3,
  Droplets,
  House,
  Sun,
  TriangleAlert,
  UtilityPole,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type FlowState = {
  solar: number;
  home: number;
  battery: number;
  soc: number;
};

type EnergyFlows = {
  solarToHome: number;
  solarToBattery: number;
  solarToGrid: number;
  batteryToHome: number;
  batteryToGrid: number;
  gridToHome: number;
  gridToBattery: number;
  gridImport: number;
  gridExport: number;
};

type ScenarioKey = "morning" | "sunny" | "demand" | "evening" | "custom";
type DayPoint = FlowState & { minute: number; phase: string };
type Point = { x: number; y: number };
type RibbonProfile = "direct" | "arc";
type FlowLayout = { solarY: number; homeY: number; lowerY: number };
type CurrentWeather = { temperature: number; weatherCode: number; cloudCover: number };

type ArtworkRibbon = {
  id: string;
  start: Point;
  controlA: Point;
  controlB: Point;
  end: Point;
  from: string;
  to: string;
  power: number;
  profile: RibbonProfile;
};

const scenarios: Record<Exclude<ScenarioKey, "custom">, FlowState> = {
  morning: { solar: 5, home: 10, battery: -2, soc: 49 },
  sunny: { solar: 10, home: 3, battery: 2, soc: 49 },
  demand: { solar: 7, home: 14, battery: -2, soc: 49 },
  evening: { solar: 0.6, home: 4.2, battery: -3, soc: 71 },
};

const scenarioLabels: Record<Exclude<ScenarioKey, "custom">, string> = {
  morning: "Morning",
  sunny: "Solar peak",
  demand: "High demand",
  evening: "Evening",
};

const dayProfile: DayPoint[] = [
  { minute: 0, solar: 0, home: 2.6, battery: 2, soc: 22, phase: "Overnight charging" },
  { minute: 360, solar: 0, home: 2.3, battery: -1.5, soc: 43, phase: "Before sunrise" },
  { minute: 510, solar: 3, home: 5, battery: 1, soc: 48, phase: "Morning balance" },
  { minute: 581, solar: 5, home: 10, battery: -2, soc: 49, phase: "Morning demand" },
  { minute: 690, solar: 7, home: 1, battery: 4, soc: 52, phase: "Battery charging" },
  { minute: 810, solar: 10, home: 3, battery: 2, soc: 64, phase: "Solar peak" },
  { minute: 1080, solar: 7, home: 14, battery: -2, soc: 49, phase: "Evening demand" },
  { minute: 1260, solar: 0.4, home: 6.2, battery: -4, soc: 35, phase: "Battery support" },
  { minute: 1440, solar: 0, home: 2.6, battery: 2, soc: 22, phase: "Overnight charging" },
];

const asset = (name: string) => `./figma/${name}`;

function weatherPresentation(code: number) {
  if (code === 0) return { label: "Clear", Icon: Sun };
  if ([1, 2].includes(code)) return { label: "Partly cloudy", Icon: CloudSun };
  return { label: "Cloudy", Icon: Cloud };
}

function formatPower(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatClock(minutes: number) {
  const normalized = Math.round(minutes) % 1440;
  const hours = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function currentMunichMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 9);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 41);
  return hour * 60 + minute;
}

function getDaySample(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const rightIndex = dayProfile.findIndex((point) => point.minute > normalized);
  const right = dayProfile[rightIndex === -1 ? dayProfile.length - 1 : rightIndex];
  const leftIndex = Math.max(0, (rightIndex === -1 ? dayProfile.length - 1 : rightIndex) - 1);
  const left = dayProfile[leftIndex];
  const duration = Math.max(1, right.minute - left.minute);
  const raw = Math.max(0, Math.min(1, (normalized - left.minute) / duration));
  const progress = raw * raw * (3 - 2 * raw);
  const interpolate = (start: number, end: number) => start + (end - start) * progress;

  return {
    phase: raw < 0.64 ? left.phase : right.phase,
    state: {
      solar: interpolate(left.solar, right.solar),
      home: interpolate(left.home, right.home),
      battery: interpolate(left.battery, right.battery),
      soc: Math.round(interpolate(left.soc, right.soc)),
    },
  };
}

function rgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const number = Number.parseInt(clean, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function pointOnCurve(start: Point, controlA: Point, controlB: Point, end: Point, progress: number) {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * progress * controlA.x + 3 * inverse * progress ** 2 * controlB.x + progress ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * progress * controlA.y + 3 * inverse * progress ** 2 * controlB.y + progress ** 3 * end.y,
  };
}

function tangentOnCurve(start: Point, controlA: Point, controlB: Point, end: Point, progress: number) {
  const inverse = 1 - progress;
  return {
    x: 3 * inverse ** 2 * (controlA.x - start.x) + 6 * inverse * progress * (controlB.x - controlA.x) + 3 * progress ** 2 * (end.x - controlB.x),
    y: 3 * inverse ** 2 * (controlA.y - start.y) + 6 * inverse * progress * (controlB.y - controlA.y) + 3 * progress ** 2 * (end.y - controlB.y),
  };
}

function createRibbonShape(item: ArtworkRibbon, width: number) {
  const edgeA: Point[] = [];
  const edgeB: Point[] = [];
  const samples = 72;

  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples;
    const point = pointOnCurve(item.start, item.controlA, item.controlB, item.end, progress);
    const tangent = tangentOnCurve(item.start, item.controlA, item.controlB, item.end, progress);
    const length = Math.max(0.001, Math.hypot(tangent.x, tangent.y));
    const normal = { x: -tangent.y / length, y: tangent.x / length };
    const terminalWeight = Math.pow(Math.abs(progress * 2 - 1), item.profile === "direct" ? 1.48 : 1.72);
    const middleFloor = item.profile === "direct" ? 0.34 : 0.25;
    const fullWidth = width * (middleFloor + (1 - middleFloor) * terminalWeight);
    const half = fullWidth * 0.5;
    edgeA.push({ x: point.x + normal.x * half, y: point.y + normal.y * half });
    edgeB.push({ x: point.x - normal.x * half, y: point.y - normal.y * half });
  }

  const shape = new Path2D();
  shape.moveTo(edgeA[0].x, edgeA[0].y);
  for (let index = 1; index < edgeA.length; index += 1) shape.lineTo(edgeA[index].x, edgeA[index].y);
  for (let index = edgeB.length - 1; index >= 0; index -= 1) shape.lineTo(edgeB[index].x, edgeB[index].y);
  shape.closePath();

  const edgePathA = new Path2D();
  edgePathA.moveTo(edgeA[0].x, edgeA[0].y);
  for (let index = 1; index < edgeA.length; index += 1) edgePathA.lineTo(edgeA[index].x, edgeA[index].y);

  const edgePathB = new Path2D();
  edgePathB.moveTo(edgeB[0].x, edgeB[0].y);
  for (let index = 1; index < edgeB.length; index += 1) edgePathB.lineTo(edgeB[index].x, edgeB[index].y);

  return { shape, edgePathA, edgePathB };
}

function EnergyArtwork({ flows, layout, motionOverride }: { flows: EnergyFlows; layout: FlowLayout; motionOverride: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentWidths = useRef<Record<string, number>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !motionOverride;
    let animationFrame = 0;

    function drawRibbon(item: ArtworkRibbon, width: number, time: number) {
      if (!context || width < 0.35) return;
      const ribbon = createRibbonShape(item, width);
      const gradient = context.createLinearGradient(item.start.x, item.start.y, item.end.x, item.end.y);
      gradient.addColorStop(0, item.from);
      gradient.addColorStop(item.profile === "direct" ? 0.35 : 0.46, item.from);
      gradient.addColorStop(item.profile === "direct" ? 0.62 : 0.86, item.to);
      gradient.addColorStop(1, item.to);

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.fillStyle = gradient;
      context.globalAlpha = 0.2;
      context.shadowColor = rgba(item.to, 0.7);
      context.shadowBlur = Math.min(38, 12 + width * 0.36);
      context.fill(ribbon.shape);

      context.globalAlpha = 0.96;
      context.shadowColor = rgba(item.to, 0.4);
      context.shadowBlur = Math.max(10, width * 0.24);
      context.fill(ribbon.shape);

      context.shadowBlur = 0;
      context.globalAlpha = 0.36;
      context.lineWidth = 0.9;
      context.strokeStyle = gradient;
      context.stroke(ribbon.edgePathA);
      context.stroke(ribbon.edgePathB);
      context.restore();

      if (!reducedMotion && item.power > 0.04) {
        const count = item.profile === "direct" ? 2 : 1;
        for (let particle = 0; particle < count; particle += 1) {
          const duration = 3200 - Math.min(1650, item.power * 105);
          const progress = ((time / duration) + particle / count) % 1;
          const point = pointOnCurve(item.start, item.controlA, item.controlB, item.end, progress);
          const tangent = tangentOnCurve(item.start, item.controlA, item.controlB, item.end, progress);
          const angle = Math.atan2(tangent.y, tangent.x);
          const marker = Math.max(3.4, Math.min(7.5, width * 0.1));
          context.save();
          context.translate(point.x, point.y);
          context.rotate(angle);
          context.globalAlpha = 0.88;
          context.fillStyle = "rgba(255,255,255,0.96)";
          context.shadowColor = "white";
          context.shadowBlur = 10;
          context.beginPath();
          context.moveTo(marker * 1.7, 0);
          context.lineTo(-marker, marker * 0.74);
          context.quadraticCurveTo(-marker * 0.2, 0, -marker, -marker * 0.74);
          context.closePath();
          context.fill();
          context.restore();
        }
      }
    }

    function frame(time: number) {
      if (!context) return;
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(bounds.width * ratio);
      const pixelHeight = Math.round(bounds.height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      const w = bounds.width;
      const h = bounds.height;
      const solar = { x: w * 0.5, y: h * layout.solarY };
      const home = { x: w * 0.5, y: h * layout.homeY };
      const grid = { x: w * 0.207, y: h * layout.lowerY };
      const battery = { x: w * 0.793, y: h * layout.lowerY };
      const upperSpan = layout.lowerY - layout.solarY;
      const lowerSpan = layout.lowerY - layout.homeY;
      const loopY = Math.min(0.965, layout.lowerY + 0.17);
      const paths: ArtworkRibbon[] = [
        {
          id: "solar-grid", power: flows.solarToGrid, start: solar,
          controlA: { x: w * 0.27, y: h * (layout.solarY + upperSpan * 0.24) }, controlB: { x: w * 0.06, y: h * (layout.solarY + upperSpan * 0.69) }, end: grid,
          from: "#ff8b00", to: "#c000e5", profile: "arc",
        },
        {
          id: "solar-battery", power: flows.solarToBattery, start: solar,
          controlA: { x: w * 0.73, y: h * (layout.solarY + upperSpan * 0.24) }, controlB: { x: w * 0.94, y: h * (layout.solarY + upperSpan * 0.69) }, end: battery,
          from: "#ff8b00", to: "#10c8e8", profile: "arc",
        },
        {
          id: "grid-home", power: flows.gridToHome, start: grid,
          controlA: { x: w * 0.205, y: h * (layout.lowerY - lowerSpan * 0.28) }, controlB: { x: w * 0.36, y: h * (layout.homeY + lowerSpan * 0.3) }, end: home,
          from: "#c000e5", to: "#5b55e6", profile: "arc",
        },
        {
          id: "battery-home", power: flows.batteryToHome, start: battery,
          controlA: { x: w * 0.795, y: h * (layout.lowerY - lowerSpan * 0.28) }, controlB: { x: w * 0.64, y: h * (layout.homeY + lowerSpan * 0.3) }, end: home,
          from: "#10c8e8", to: "#ff8200", profile: "arc",
        },
        {
          id: "grid-battery", power: flows.gridToBattery, start: grid,
          controlA: { x: w * 0.34, y: h * loopY }, controlB: { x: w * 0.66, y: h * loopY }, end: battery,
          from: "#c000e5", to: "#10c8e8", profile: "arc",
        },
        {
          id: "battery-grid", power: flows.batteryToGrid, start: battery,
          controlA: { x: w * 0.66, y: h * loopY }, controlB: { x: w * 0.34, y: h * loopY }, end: grid,
          from: "#10c8e8", to: "#c000e5", profile: "arc",
        },
        {
          id: "solar-home", power: flows.solarToHome, start: solar,
          controlA: { x: w * 0.5, y: h * (layout.solarY + (layout.homeY - layout.solarY) * 0.42) }, controlB: { x: w * 0.5, y: h * (layout.solarY + (layout.homeY - layout.solarY) * 0.62) }, end: home,
          from: "#ff8500", to: "#5b55e6", profile: "direct",
        },
      ];

      for (const item of paths) {
        const scale = w / 375;
        const target = item.power < 0.04 ? 0 : Math.min(100, 22 + 20 * Math.sqrt(item.power)) * scale;
        const existing = currentWidths.current[item.id] ?? target;
        const next = existing + (target - existing) * 0.09;
        currentWidths.current[item.id] = Math.abs(next - target) < 0.05 ? target : next;
        drawRibbon(item, next, time);
      }

      animationFrame = window.requestAnimationFrame(frame);
    }

    frame(0);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [flows, layout, motionOverride]);

  return <canvas ref={canvasRef} className="energy-art" aria-hidden="true" />;
}

type EnergyNodeStyle = CSSProperties & {
  "--node-size"?: string;
  "--node-ring"?: string;
  "--node-x"?: string;
  "--node-y"?: string;
};

type NodeProps = {
  kind: "solar" | "home" | "grid" | "battery";
  value: number;
  label: string;
  size: number;
  detail?: string;
  ring?: string;
  fault?: boolean;
  x: number;
  y: number;
  Icon: LucideIcon;
};

function EnergyNode({ kind, value, label, size, detail, ring, fault = false, x, y, Icon }: NodeProps) {
  const style: EnergyNodeStyle = {
    "--node-size": `${size / 7.5}%`,
    "--node-x": `${x * 100}%`,
    "--node-y": `${y * 100}%`,
    ...(ring ? { "--node-ring": ring } : {}),
  };

  return (
    <article
      className={`energy-node ${kind}-node${fault ? " fault-node" : ""}`}
      style={style}
      aria-label={`${label}: ${fault ? "fault" : `${formatPower(value)} kilowatts`}${detail ? `, ${detail}` : ""}`}
    >
      <span className="node-aura" aria-hidden="true" />
      <span className="node-icon-wrap" aria-hidden="true"><Icon className="node-icon" strokeWidth={kind === "home" ? 1.65 : 1.8} /></span>
      <div className="node-reading">
        <strong>{fault ? "--" : formatPower(value)}</strong><span>{fault ? "kW" : "kW"}</span>
      </div>
      <span className="node-label">{label}</span>
      {detail && <span className="node-detail">{detail}</span>}
    </article>
  );
}

function SmartDevices() {
  const cards = [
    { label: "Heat Pump", power: "1.67", status: "Heating" },
    { label: "Water Heater", power: "0.84", status: "Scheduled" },
    { label: "Pool Pump", power: "0.62", status: "Running" },
  ];
  return (
    <section className="smart-devices" aria-label="Smart devices">
      <div className="smart-heading"><span><Zap aria-hidden="true" /></span><div><h2>Smart Devices</h2><small>3 connected · 3.13 kW</small></div></div>
      <div className="device-cards">
        {cards.map((device) => (
          <article className="device-card" key={device.label}>
            <span className="device-bolt"><Zap aria-hidden="true" /></span>
            <div className="device-reading"><strong>{device.power}</strong><span>kW</span></div>
            <b>{device.label}</b>
            <small><i aria-hidden="true" />{device.status}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

const hourlyForecast = [
  { time: "Now", temperature: "32°", Icon: Sun },
  { time: "11", temperature: "33°", Icon: Sun },
  { time: "12", temperature: "33°", Icon: Sun },
  { time: "13", temperature: "32°", Icon: CloudSun },
  { time: "14", temperature: "30°", Icon: Cloud },
];

function WeatherPanel({ open, onClose, closeRef, weather }: { open: boolean; onClose: () => void; closeRef: RefObject<HTMLButtonElement | null>; weather: CurrentWeather }) {
  if (!open) return null;

  const { label, Icon: WeatherIcon } = weatherPresentation(weather.weatherCode);

  return (
    <div className="weather-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="weather-panel" role="dialog" aria-modal="true" aria-labelledby="weather-title">
        <div className="weather-panel-top">
          <div className="weather-title-lockup"><span className="weather-title-icon"><Sun aria-hidden="true" /></span><div><span>PLANT CONDITIONS</span><h2 id="weather-title">Weather &amp; solar</h2></div></div>
          <button ref={closeRef} className="weather-close" aria-label="Close weather" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <div className="weather-current">
          <div className="weather-temperature"><span>{label} in Munich</span><strong>{Math.round(weather.temperature)}°</strong><p>Current conditions · {Math.round(weather.cloudCover)}% cloud cover</p></div>
          <div className="weather-solar-ring"><span><WeatherIcon aria-hidden="true" /></span><small>Solar outlook</small><strong>{weather.cloudCover < 45 ? "High" : "Variable"}</strong></div>
        </div>
        <div className="weather-production"><Zap aria-hidden="true" /><span><small>ENERGY FORECAST</small><strong>Strong production until 16:00</strong></span><b>Peak 13:30</b></div>
        <div className="hourly-forecast" aria-label="Hourly forecast">
          {hourlyForecast.map(({ time, temperature, Icon }) => (
            <div className={time === "Now" ? "current" : ""} key={time}><span>{time}</span><Icon aria-hidden="true" /><strong>{temperature}</strong></div>
          ))}
        </div>
        <div className="weather-metrics">
          <article><Droplets aria-hidden="true" /><span>Humidity</span><strong>34%</strong></article>
          <article><Wind aria-hidden="true" /><span>Wind</span><strong>11 km/h</strong></article>
          <article><Sun aria-hidden="true" /><span>Solar index</span><strong>High</strong></article>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [values, setValues] = useState<FlowState>(scenarios.morning);
  const [scenario, setScenario] = useState<ScenarioKey>("morning");
  const [dayMode, setDayMode] = useState(true);
  const [dayPlaying, setDayPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [motionOverride, setMotionOverride] = useState(false);
  const [dayMinutes, setDayMinutes] = useState(currentMunichMinutes);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [batteryFault, setBatteryFault] = useState(false);
  const [smartDevicesEnabled, setSmartDevicesEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const [weather, setWeather] = useState<CurrentWeather>({ temperature: 32, weatherCode: 0, cloudCover: 15 });
  const noticeTimer = useRef<number | null>(null);
  const weatherTriggerRef = useRef<HTMLButtonElement>(null);
  const weatherCloseRef = useRef<HTMLButtonElement>(null);
  const daySample = useMemo(() => getDaySample(dayMinutes), [dayMinutes]);
  const activeValues = dayMode ? daySample.state : values;
  const effectiveValues = useMemo(() => batteryFault ? { ...activeValues, battery: 0 } : activeValues, [activeValues, batteryFault]);
  const flowLayout = useMemo<FlowLayout>(() => smartDevicesEnabled
    ? { solarY: 0.17, homeY: 0.46, lowerY: 0.66 }
    : { solarY: 0.15, homeY: 0.46, lowerY: 0.72 }, [smartDevicesEnabled]);

  useEffect(() => {
    if (!dayMode || !dayPlaying || (window.matchMedia("(prefers-reduced-motion: reduce)").matches && !motionOverride)) return;
    const timer = window.setInterval(() => setDayMinutes((current) => (current + 4) % 1440), 120);
    return () => window.clearInterval(timer);
  }, [dayMode, dayPlaying, motionOverride]);

  useEffect(() => {
    if (!weatherOpen) return;
    weatherCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWeatherOpen(false);
        window.requestAnimationFrame(() => weatherTriggerRef.current?.focus());
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [weatherOpen]);

  useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      try {
        const endpoint = "https://api.open-meteo.com/v1/forecast?latitude=48.1374&longitude=11.5755&current=temperature_2m,weather_code,cloud_cover&timezone=Europe%2FBerlin";
        const response = await fetch(endpoint, { credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !data.current) return;
        setWeather({
          temperature: Number(data.current.temperature_2m ?? 32),
          weatherCode: Number(data.current.weather_code ?? 0),
          cloudCover: Number(data.current.cloud_cover ?? 15),
        });
      } catch {
        // The prototype keeps its local fallback when live weather is unavailable.
      }
    };
    loadWeather();
    const refresh = window.setInterval(loadWeather, 15 * 60 * 1000);
    return () => { active = false; window.clearInterval(refresh); };
  }, []);

  const flows = useMemo<EnergyFlows>(() => {
    const solarToHome = Math.min(effectiveValues.solar, effectiveValues.home);
    const homeAfterSolar = Math.max(0, effectiveValues.home - solarToHome);
    const solarSurplus = Math.max(0, effectiveValues.solar - solarToHome);

    if (effectiveValues.battery >= 0) {
      const solarToBattery = Math.min(effectiveValues.battery, solarSurplus);
      const gridToBattery = Math.max(0, effectiveValues.battery - solarToBattery);
      const solarToGrid = Math.max(0, solarSurplus - solarToBattery);
      const gridImport = homeAfterSolar + gridToBattery;
      return {
        solarToHome, solarToBattery, solarToGrid, batteryToHome: 0, batteryToGrid: 0,
        gridToHome: homeAfterSolar, gridToBattery, gridImport, gridExport: solarToGrid,
      };
    }

    const discharge = Math.abs(effectiveValues.battery);
    const batteryToHome = Math.min(discharge, homeAfterSolar);
    const batteryToGrid = Math.max(0, discharge - batteryToHome);
    const gridToHome = Math.max(0, homeAfterSolar - batteryToHome);
    const solarToGrid = solarSurplus;
    return {
      solarToHome, solarToBattery: 0, solarToGrid, batteryToHome, batteryToGrid,
      gridToHome, gridToBattery: 0, gridImport: gridToHome, gridExport: solarToGrid + batteryToGrid,
    };
  }, [effectiveValues]);

  const gridIsExporting = flows.gridExport > flows.gridImport;
  const gridPower = Math.abs(flows.gridExport - flows.gridImport);
  const homeTotal = Math.max(0.01, flows.solarToHome + flows.batteryToHome + flows.gridToHome);
  const solarShare = Math.min(100, flows.solarToHome / homeTotal * 100);
  const batteryShare = Math.min(100 - solarShare, flows.batteryToHome / homeTotal * 100);
  const batteryStop = solarShare + batteryShare;
  const homeRing = `conic-gradient(from -90deg, #ff8200 0 ${solarShare.toFixed(2)}%, #10c8e8 ${solarShare.toFixed(2)}% ${batteryStop.toFixed(2)}%, #c000e5 ${batteryStop.toFixed(2)}% 100%)`;
  const solarNodeSize = 200 + Math.min(14, effectiveValues.solar) * 4;
  const homeNodeSize = 260 + Math.min(14, effectiveValues.home) * 6;
  const gridNodeSize = 200 + Math.min(14, gridPower) * 4;
  const batteryNodeSize = 220 + Math.min(7, Math.abs(effectiveValues.battery)) * 6;
  const batteryIdle = !batteryFault && Math.abs(effectiveValues.battery) < 0.04;

  const energySources = [
    { id: "solar", value: effectiveValues.solar, label: "solar" },
    ...(effectiveValues.battery < 0 ? [{ id: "battery", value: Math.abs(effectiveValues.battery), label: "battery" }] : []),
    ...(flows.gridImport > 0.04 ? [{ id: "grid", value: flows.gridImport, label: "grid" }] : []),
  ];
  const energyUses = [
    { id: "home", value: effectiveValues.home, label: "home" },
    ...(effectiveValues.battery > 0 ? [{ id: "battery", value: effectiveValues.battery, label: "battery" }] : []),
    ...(flows.gridExport > 0.04 ? [{ id: "grid", value: flows.gridExport, label: "grid" }] : []),
  ];

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2200);
  }

  function selectScenario(key: Exclude<ScenarioKey, "custom">) {
    setDayMode(false);
    setDayPlaying(false);
    setMotionOverride(false);
    setScenario(key);
    setValues(scenarios[key]);
  }

  function updateValue(key: keyof FlowState, value: number) {
    setDayMode(false);
    setDayPlaying(false);
    setMotionOverride(false);
    setScenario("custom");
    setValues({ ...activeValues, [key]: value });
  }

  function toggleDayPlayback() {
    if (!dayMode) {
      setDayMode(true);
      setDayPlaying(true);
      setMotionOverride(true);
      return;
    }
    setDayPlaying((current) => {
      const next = !current;
      setMotionOverride(next);
      return next;
    });
  }

  function closeWeather() {
    setWeatherOpen(false);
    window.requestAnimationFrame(() => weatherTriggerRef.current?.focus());
  }

  function openControls() {
    setWeatherOpen(false);
    setControlsOpen(true);
  }

  const BatteryIcon = batteryFault ? TriangleAlert : effectiveValues.battery > 0 ? BatteryCharging : BatteryMedium;
  const batteryLabel = batteryFault ? "Battery fault" : batteryIdle ? "Standby" : effectiveValues.battery > 0 ? "Charging" : "Discharging";
  const { label: weatherLabel, Icon: CurrentWeatherIcon } = weatherPresentation(weather.weatherCode);

  return (
    <div className="site-canvas">
      <div className={`prototype-shell ${smartDevicesEnabled ? "has-smart-devices" : "no-smart-devices"}${dayPlaying ? " is-playing" : ""}${motionOverride ? " motion-enabled" : ""}`}>
        <div className="status-bar" aria-hidden="true">
          <strong>9:41</strong>
          <span className="status-icons">
            <img src={asset("status-cellular.svg")} alt="" />
            <img src={asset("status-wifi.svg")} alt="" />
            <img src={asset("status-battery.svg")} alt="" />
          </span>
        </div>

        <header className="app-header">
          <div className="title-row">
            <button className="header-button back-button" aria-label="Go back" onClick={() => showNotice("Back navigation is ready to connect")}>
              <img src={asset("back.svg")} alt="" />
            </button>
            <strong>Plant Name</strong>
            <button className="header-button menu-button" aria-label="Open live energy controls" onClick={openControls}><span /><span /><span /></button>
          </div>
          <nav className="top-tabs" aria-label="Plant sections">
            <button className="top-tab active" aria-current="page">Energy Flow</button>
            <button className="top-tab" onClick={() => showNotice("EV Charger screen is not part of this prototype")}>EV Charger</button>
            <button className="top-tab" onClick={() => showNotice("Dashboard screen is not part of this prototype")}>Dashboard</button>
          </nav>
        </header>

        <section className="plant-summary" aria-label="Plant status">
          <div className="live-flow-summary"><span className="live-dot" /><div><strong>Live energy flow</strong><small><Clock3 aria-hidden="true" />{formatClock(dayMinutes)} · {daySample.phase}</small></div></div>
          <button
            ref={weatherTriggerRef}
            className="weather-button"
            aria-haspopup="dialog"
            aria-expanded={weatherOpen}
            onClick={() => { setControlsOpen(false); setWeatherOpen(true); }}
          >
            <span className="weather-glyph"><CurrentWeatherIcon aria-hidden="true" /></span>
            <span><strong>{Math.round(weather.temperature)}°</strong><small>{weatherLabel}</small></span>
            <ChevronRight aria-hidden="true" />
          </button>
        </section>

        <main className="flow-stage" aria-label="Live energy flow diagram">
          <EnergyArtwork flows={flows} layout={flowLayout} motionOverride={motionOverride} />
          <p className="sr-only" aria-live="polite">
            At {formatClock(dayMinutes)}, {formatPower(flows.solarToHome)} kilowatts flow from solar to home, {formatPower(flows.gridToHome)} from grid to home, and {batteryFault ? "the battery is unavailable" : `${formatPower(Math.abs(effectiveValues.battery))} kilowatts ${batteryLabel.toLowerCase()}`}.
          </p>
          <EnergyNode kind="solar" Icon={Sun} x={0.5} y={flowLayout.solarY} value={effectiveValues.solar} label="Generating" size={solarNodeSize} />
          <EnergyNode kind="home" Icon={House} x={0.5} y={flowLayout.homeY} value={effectiveValues.home} label="Consuming" size={homeNodeSize} ring={homeRing} />
          <EnergyNode kind="grid" Icon={UtilityPole} x={0.207} y={flowLayout.lowerY} value={gridPower} label={gridPower < 0.04 ? "Grid idle" : gridIsExporting ? "Exporting" : "Importing"} size={gridNodeSize} />
          <EnergyNode kind="battery" Icon={BatteryIcon} x={0.793} y={flowLayout.lowerY} value={Math.abs(effectiveValues.battery)} label={batteryLabel} detail={batteryFault ? "Unavailable" : `${activeValues.soc}% charged`} size={batteryNodeSize} fault={batteryFault} />

          <section className="stage-timeline" aria-label="Explore your energy day">
            <div className="stage-timeline-heading">
              <span className="stage-timeline-icon"><Sun aria-hidden="true" /></span>
              <div><strong>Explore your energy day</strong><small>Drag to explore · {daySample.phase}</small></div>
              <output>{formatClock(dayMinutes)}</output>
              <button aria-label={dayMode && dayPlaying ? "Pause day simulation" : "Play day simulation"} onClick={toggleDayPlayback}>{dayMode && dayPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
            </div>
            <label className="stage-scrubber">
              <span className="sr-only">Change time of day</span>
              <input type="range" min="0" max="1439" step="5" value={dayMinutes} onChange={(event) => { setDayMode(true); setDayPlaying(false); setMotionOverride(false); setDayMinutes(Number(event.target.value)); }} />
              <span className="stage-time-labels" aria-hidden="true"><span>00</span><span>Morning</span><span>Noon</span><span>Evening</span><span>24</span></span>
            </label>
          </section>
        </main>

        {smartDevicesEnabled && <SmartDevices />}

        <nav className="bottom-nav" aria-label="Main navigation">
          {([
            [Activity, "Monitoring", true],
            [TriangleAlert, "Fault", false],
            [CircleHelp, "Support", false],
            [CircleUserRound, "Account", false],
          ] as Array<[LucideIcon, string, boolean]>).map(([Icon, label, active]) => (
            <button key={label} className={`bottom-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined} onClick={active ? undefined : () => showNotice(`${label} is ready to connect`)}>
              <span className="bottom-icon"><Icon aria-hidden="true" />{label === "Fault" && batteryFault && <i aria-label="1 active fault">1</i>}</span><span>{label}</span>
            </button>
          ))}
        </nav>

        {notice && <div className="prototype-toast" role="status">{notice}</div>}
        <WeatherPanel open={weatherOpen} onClose={closeWeather} closeRef={weatherCloseRef} weather={weather} />
      </div>

      <div className={`sheet-scrim ${controlsOpen ? "open" : ""}`} onClick={() => setControlsOpen(false)} aria-hidden="true" />
      <aside className={`controls-sheet ${controlsOpen ? "open" : ""}`} aria-hidden={!controlsOpen} aria-label="Energy flow controls">
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <div><span className="eyebrow">LIVE DAY PROTOTYPE</span><h2>Explore the energy flow</h2></div>
          <button className="sheet-close" aria-label="Close controls" onClick={() => setControlsOpen(false)}><X /></button>
        </div>
        <section className={`day-simulator ${dayMode ? "active" : ""}`} aria-label="Live day simulation">
          <div className="day-simulator-heading">
            <div><span className="day-simulator-kicker"><span className="live-dot" /> Daily live-data demo</span><strong>{formatClock(dayMinutes)} · {daySample.phase}</strong></div>
            <button onClick={toggleDayPlayback}>{dayMode && dayPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{dayMode && dayPlaying ? "Pause" : "Play day"}</button>
          </div>
          <label className="day-scrubber">
            <span className="sr-only">Time of day</span>
            <input type="range" min="0" max="1439" step="5" value={dayMinutes} onChange={(event) => { setDayMode(true); setDayPlaying(false); setMotionOverride(false); setDayMinutes(Number(event.target.value)); }} />
            <span className="day-time-labels" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></span>
          </label>
        </section>
        <p className="scenario-label">Or jump to a fixed state</p>
        <div className="scenario-control" aria-label="Demo scenarios">
          {(Object.keys(scenarios) as Array<Exclude<ScenarioKey, "custom">>).map((key) => <button key={key} className={!dayMode && scenario === key ? "active" : ""} onClick={() => selectScenario(key)}>{scenarioLabels[key]}</button>)}
        </div>
        <div className="system-options" aria-label="System options">
          <button className={batteryFault ? "active fault" : ""} role="switch" aria-checked={batteryFault} onClick={() => setBatteryFault((current) => !current)}>
            <span className="option-icon"><TriangleAlert aria-hidden="true" /></span><span><b>Battery fault simulation</b><small>{batteryFault ? "Battery is isolated from the flow" : "Battery is operating normally"}</small></span><i aria-hidden="true" />
          </button>
          <button className={smartDevicesEnabled ? "active" : ""} role="switch" aria-checked={smartDevicesEnabled} onClick={() => setSmartDevicesEnabled((current) => !current)}>
            <span className="option-icon"><Zap aria-hidden="true" /></span><span><b>Installed smart devices</b><small>{smartDevicesEnabled ? "Show 3 connected devices" : "No devices added"}</small></span><i aria-hidden="true" />
          </button>
        </div>
        <div className="sliders">
          {([
            ["solar", "Solar production", 0, 14, 0.1],
            ["home", "Home demand", 0.5, 14, 0.1],
            ["battery", "Battery flow", -7, 4, 0.1],
            ["soc", "Battery level", 5, 100, 1],
          ] as const).map(([key, label, min, max, step]) => (
            <label className="slider-row" key={key}>
              <span><b>{label}</b><output>{key === "soc" ? `${Math.round(activeValues[key])}%` : `${formatPower(activeValues[key])} kW`}</output></span>
              <input type="range" min={min} max={max} step={step} value={activeValues[key]} disabled={key === "battery" && batteryFault} onChange={(event) => updateValue(key, Number(event.target.value))} />
              {key === "battery" && <small>Negative discharges · positive charges</small>}
            </label>
          ))}
        </div>
        <div className="energy-equation">
          {energySources.map((item, index) => <Fragment key={`source-${item.id}`}>{index > 0 && <strong>+</strong>}<span>{formatPower(item.value)} kW {item.label}</span></Fragment>)}
          <strong>=</strong>
          {energyUses.map((item, index) => <Fragment key={`use-${item.id}`}>{index > 0 && <strong>+</strong>}<span>{formatPower(item.value)} kW {item.label}</span></Fragment>)}
        </div>
      </aside>
    </div>
  );
}
