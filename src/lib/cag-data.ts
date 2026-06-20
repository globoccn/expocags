export type Severity = 'normal' | 'info' | 'attention' | 'critical';
export type ChillerTone = 'blue' | 'red' | 'white';

export interface CircuitData {
  id: 'A' | 'B';
  capacity: number;
  highPressure: number;
  lowPressure: number;
  oilCp1: number;
  oilCp2: number;
  compressor1: 'Ligado' | 'Desligado';
  compressor2: 'Ligado' | 'Desligado';
  hours: number;
  startsToday: number;
}

export interface PumpData {
  id: string;
  name: string;
  status: 'Running' | 'Standby' | 'Falha' | 'Parada';
  mode: 'Remoto' | 'Local';
  pressureSetpoint: number;
  pressure: number;
  bypass: number;
  alarm: string;
  health: number;
}

export interface ChillerData {
  id: string;
  name: string;
  tone: ChillerTone;
  status: 'Running' | 'Standby' | 'Atenção' | 'Crítico';
  health: number;
  risk: number;
  anomalies: number;
  capacityTotal: number;
  setpoint: number;
  supplyTemp: number;
  returnTemp: number;
  externalTemp: number;
  demandLimit: number;
  operatingHours: number;
  startsToday: number;
  alarmStatus: string;
  activeAlarm: number;
  circuits: CircuitData[];
  pumps: PumpData[];
}

export interface AiInsight {
  time: string;
  severity: Severity;
  asset: string;
  title: string;
  message: string;
  confidence?: number;
}

export const chillers: ChillerData[] = [
  {
    id: 'azul', name: 'Chiller Azul', tone: 'blue', status: 'Running', health: 92, risk: 18, anomalies: 0,
    capacityTotal: 35, setpoint: 5.0, supplyTemp: 5.3, returnTemp: 9.1, externalTemp: 26.2, demandLimit: 100,
    operatingHours: 85786, startsToday: 12, alarmStatus: 'Normal', activeAlarm: 0,
    circuits: [
      { id: 'A', capacity: 18, highPressure: 677, lowPressure: 257, oilCp1: 246, oilCp2: 203, compressor1: 'Ligado', compressor2: 'Desligado', hours: 42530, startsToday: 7 },
      { id: 'B', capacity: 17, highPressure: 686, lowPressure: 247, oilCp1: 241, oilCp2: 211, compressor1: 'Ligado', compressor2: 'Desligado', hours: 43256, startsToday: 5 },
    ],
    pumps: [
      { id: 'AZ-B01', name: 'Bomba Azul 01', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 352, bypass: 18, alarm: 'Nenhum', health: 96 },
      { id: 'AZ-B02', name: 'Bomba Azul 02', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 348, bypass: 16, alarm: 'Nenhum', health: 94 },
      { id: 'AZ-B03', name: 'Bomba Azul 03', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 351, bypass: 14, alarm: 'Nenhum', health: 95 },
      { id: 'AZ-B04', name: 'Bomba Azul 04', status: 'Standby', mode: 'Remoto', pressureSetpoint: 350, pressure: 0, bypass: 0, alarm: 'Nenhum', health: 88 },
    ],
  },
  {
    id: 'vermelho', name: 'Chiller Vermelho', tone: 'red', status: 'Running', health: 76, risk: 31, anomalies: 2,
    capacityTotal: 48, setpoint: 5.0, supplyTemp: 4.6, returnTemp: 5.8, externalTemp: 27.1, demandLimit: 100,
    operatingHours: 2875, startsToday: 24, alarmStatus: 'Atenção', activeAlarm: 2,
    circuits: [
      { id: 'A', capacity: 45, highPressure: 677, lowPressure: 257, oilCp1: 246, oilCp2: 203, compressor1: 'Ligado', compressor2: 'Desligado', hours: 8578, startsToday: 15 },
      { id: 'B', capacity: 52, highPressure: 786, lowPressure: 287, oilCp1: 213, oilCp2: 230, compressor1: 'Ligado', compressor2: 'Ligado', hours: 28795, startsToday: 9 },
    ],
    pumps: [
      { id: 'VM-B01', name: 'Bomba Vermelha 01', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 353, bypass: 15, alarm: 'Nenhum', health: 92 },
      { id: 'VM-B02', name: 'Bomba Vermelha 02', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 346, bypass: 22, alarm: 'Nenhum', health: 90 },
      { id: 'VM-B03', name: 'Bomba Vermelha 03', status: 'Falha', mode: 'Remoto', pressureSetpoint: 350, pressure: 180, bypass: 100, alarm: 'Falha', health: 12 },
      { id: 'VM-B04', name: 'Bomba Vermelha 04', status: 'Standby', mode: 'Local', pressureSetpoint: 350, pressure: 0, bypass: 0, alarm: 'Local', health: 85 },
    ],
  },
  {
    id: 'branco', name: 'Chiller Branco', tone: 'white', status: 'Standby', health: 84, risk: 22, anomalies: 1,
    capacityTotal: 0, setpoint: 5.0, supplyTemp: 5.1, returnTemp: 5.3, externalTemp: 26.0, demandLimit: 100,
    operatingHours: 64210, startsToday: 4, alarmStatus: 'Normal', activeAlarm: 0,
    circuits: [
      { id: 'A', capacity: 0, highPressure: 620, lowPressure: 210, oilCp1: 225, oilCp2: 207, compressor1: 'Desligado', compressor2: 'Desligado', hours: 32012, startsToday: 2 },
      { id: 'B', capacity: 0, highPressure: 615, lowPressure: 205, oilCp1: 220, oilCp2: 201, compressor1: 'Desligado', compressor2: 'Desligado', hours: 32198, startsToday: 2 },
    ],
    pumps: [
      { id: 'BR-B01', name: 'Bomba Branca 01', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 340, bypass: 30, alarm: 'Nenhum', health: 82 },
      { id: 'BR-B02', name: 'Bomba Branca 02', status: 'Running', mode: 'Remoto', pressureSetpoint: 350, pressure: 338, bypass: 32, alarm: 'Nenhum', health: 80 },
      { id: 'BR-B03', name: 'Bomba Branca 03', status: 'Standby', mode: 'Remoto', pressureSetpoint: 350, pressure: 0, bypass: 0, alarm: 'Nenhum', health: 88 },
      { id: 'BR-B04', name: 'Bomba Branca 04', status: 'Standby', mode: 'Remoto', pressureSetpoint: 350, pressure: 0, bypass: 0, alarm: 'Nenhum', health: 88 },
    ],
  },
];

export const systemInsights: AiInsight[] = [
  { time: '10:28', severity: 'attention', asset: 'Chiller Vermelho', title: 'Delta T baixo', message: 'Delta T abaixo do ideal com bombas em operação e válvula bypass parcialmente aberta.', confidence: 82 },
  { time: '10:18', severity: 'critical', asset: 'Bomba Vermelha 03', title: 'Bomba em falha', message: 'Pressão muito abaixo do setpoint e bypass em 100%. Verificar bomba, sensor e comando local/remoto.', confidence: 91 },
  { time: '10:10', severity: 'attention', asset: 'Circuito B Vermelho', title: 'Pressão alta acima do padrão', message: 'Pressão alta 15% acima do Circuito A para temperatura externa semelhante.', confidence: 78 },
  { time: '10:05', severity: 'info', asset: 'Bomba Azul 02', title: 'Retorno para Remoto', message: 'Bomba voltou para modo remoto e pressão estabilizou.', confidence: 96 },
];

export const trend24h = Array.from({ length: 24 }, (_, i) => {
  const hour = (10 + i) % 24;
  return {
    time: `${String(hour).padStart(2, '0')}:00`,
    retorno: 5.6 + Math.sin(i / 2) * 0.25 + (i > 12 ? -0.2 : 0),
    saida: 5.1 + Math.sin(i / 3) * 0.18,
    setpoint: 5,
    deltaT: i < 8 ? 3.2 + Math.sin(i) * 0.5 : i < 16 ? 1.2 + Math.sin(i) * 0.35 : 2.1 + Math.sin(i) * 0.4,
    capacidade: 30 + Math.sin(i / 2) * 15 + (i > 8 && i < 18 ? 22 : 0),
    pressaoA: 675 + Math.sin(i / 2) * 18,
    pressaoB: 735 + Math.sin(i / 2) * 22 + (i > 10 ? 30 : 0),
    bypass: 15 + Math.max(0, Math.sin(i / 3) * 25) + (i > 13 ? 30 : 0),
    externa: 26 + Math.sin(i / 5) * 2.2,
  };
});

export function deltaT(chiller: ChillerData) {
  return +(chiller.returnTemp - chiller.supplyTemp).toFixed(1);
}

export function allPumps() {
  return chillers.flatMap((c) => c.pumps.map((p) => ({ ...p, chiller: c.name, tone: c.tone })));
}

export function toneClasses(tone: ChillerTone) {
  if (tone === 'blue') return { text: 'text-cyan-300', border: 'border-cyan-400/35', bg: 'from-cyan-500/20', glow: 'shadow-[0_0_28px_rgba(34,211,238,.18)]' };
  if (tone === 'red') return { text: 'text-red-300', border: 'border-red-400/35', bg: 'from-red-500/20', glow: 'shadow-[0_0_28px_rgba(248,113,113,.18)]' };
  return { text: 'text-slate-100', border: 'border-slate-200/35', bg: 'from-slate-100/15', glow: 'shadow-[0_0_28px_rgba(226,232,240,.16)]' };
}
