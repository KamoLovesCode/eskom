
export enum LoadSheddingStage {
  NONE = "None",
  STAGE_1 = "Stage 1",
  STAGE_2 = "Stage 2",
  STAGE_3 = "Stage 3",
  STAGE_4 = "Stage 4",
  STAGE_5 = "Stage 5",
  STAGE_6 = "Stage 6",
}

export interface ScheduleSlot {
  stage: LoadSheddingStage;
  startTime: Date;
  endTime: Date;
}

export enum SmartDeviceType {
  GEYSER = "Geyser",
  PLUG = "Smart Plug",
  LIGHT = "Light Switch",
  APPLIANCE = "Appliance",
  BATTERY = "Backup Battery",
}

export interface SmartDevice {
  id: string;
  name: string;
  type: SmartDeviceType;
  powerConsumption: number; // in Watts
  isOn: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface PowerDataPoint {
  time: string;
  wattage: number;
}
