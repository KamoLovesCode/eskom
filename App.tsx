import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SmartDevice, ScheduleSlot, AutomationRule, PowerDataPoint } from './types';
import { LoadSheddingStage, SmartDeviceType } from './types';
import { getPowerSavingTips } from './services/geminiService';
import { Card } from './components/Card';
import { IconWrapper, ScheduleIcon, DeviceIcon, UsageIcon, AutomationIcon, AiIcon, LockIcon, BatteryIcon, SolarIcon, CommunityIcon, PremiumIcon } from './constants';

// --- MOCK DATA ---
const initialDevices: SmartDevice[] = [
  { id: '1', name: 'Geyser', type: SmartDeviceType.GEYSER, powerConsumption: 3000, isOn: false },
  { id: '2', name: 'Living Room TV', type: SmartDeviceType.APPLIANCE, powerConsumption: 250, isOn: true },
  { id: '3', name: 'Kitchen Lights', type: SmartDeviceType.LIGHT, powerConsumption: 50, isOn: true },
  { id: '4', name: 'Fridge', type: SmartDeviceType.APPLIANCE, powerConsumption: 200, isOn: true },
  { id: '5', name: 'Backup Battery', type: SmartDeviceType.BATTERY, powerConsumption: -1500, isOn: false },
];

const mockSchedule: ScheduleSlot[] = [
  { stage: LoadSheddingStage.STAGE_4, startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000) },
  { stage: LoadSheddingStage.STAGE_4, startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), endTime: new Date(Date.now() + 12.5 * 60 * 60 * 1000) },
];

const mockRules: AutomationRule[] = [
    { id: '1', name: 'Geyser Saver', description: 'Turn off Geyser 30 mins before load shedding', isEnabled: true },
    { id: '2', name: 'Battery Guard', description: 'Enable battery backup when load shedding starts', isEnabled: true },
    { id: '3', name: 'Welcome Home', description: 'Turn on lights at sunset if you are home', isEnabled: false },
];

// --- PAGE & LAYOUT COMPONENTS ---

type Page = 'schedule' | 'devices' | 'usage' | 'automation' | 'ai' | 'premium';

const PageHeader: React.FC<{title: string; subtitle: string}> = ({ title, subtitle }) => (
    <div className="mb-12">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-gray-400 mt-2 text-lg">{subtitle}</p>
    </div>
);

const Sidebar: React.FC<{currentPage: Page; onPageChange: (page: Page) => void;}> = ({ currentPage, onPageChange }) => {
    const navItems = [
        { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon /> },
        { id: 'devices', label: 'Devices', icon: <DeviceIcon /> },
        { id: 'usage', label: 'Usage', icon: <UsageIcon /> },
        { id: 'automation', label: 'Automation', icon: <AutomationIcon /> },
        { id: 'ai', label: 'AI Helper', icon: <AiIcon /> },
        { id: 'premium', label: 'Premium', icon: <PremiumIcon /> },
    ] as const;

    return (
        <aside className="w-72 bg-black flex flex-col p-6">
            <div className="text-left py-4 mb-6">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">PowerSense AI</h1>
            </div>
            <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                            currentPage === item.id 
                                ? 'bg-white text-black shadow-lg' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span className="font-semibold text-base">{item.label}</span>
                    </button>
                ))}
            </nav>
            <footer className="text-center mt-auto text-gray-700 text-xs">
                <p>Version 2.1 Desktop</p>
            </footer>
        </aside>
    );
}

// --- FEATURE PAGE COMPONENTS ---

const SchedulePage: React.FC<{ schedule: ScheduleSlot[] }> = ({ schedule }) => {
    const [timeToNext, setTimeToNext] = useState('');

    const calculateTimeToNext = useCallback(() => {
        if (schedule.length === 0) return 'No schedule';
        const now = new Date();
        const nextSlot = schedule.find(slot => slot.startTime > now);
        if (!nextSlot) return 'No upcoming slots';

        const diff = nextSlot.startTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [schedule]);
    
    useEffect(() => {
        setTimeToNext(calculateTimeToNext());
        const timer = setInterval(() => {
            setTimeToNext(calculateTimeToNext());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeToNext]);

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="animate-fade-in">
            <PageHeader title="Load Shedding Schedule" subtitle="Stay ahead of the outages with real-time schedule information." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="lg:col-span-1 justify-center text-center">
                    <p className="text-gray-400 font-semibold">Next Slot In</p>
                    <p className="text-7xl font-black text-white tracking-tight my-2">{timeToNext}</p>
                    <p className="text-3xl text-gray-300 font-bold">{schedule.length > 0 ? schedule[0].stage : 'N/A'}</p>
                </Card>
                <Card className="lg:col-span-2">
                    <h3 className="font-bold text-white mb-6 text-xl">Upcoming Slots Today</h3>
                     <div className="space-y-4">
                        {schedule.slice(0, 4).map((slot, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-800 p-5 rounded-lg transition-colors hover:bg-gray-700/50">
                                <span className="font-bold text-lg text-white">{slot.stage}</span>
                                <span className="text-gray-300 font-mono text-lg">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const DeviceControlPage: React.FC<{ devices: SmartDevice[]; onToggle: (id: string) => void; }> = ({ devices, onToggle }) => {
    const totalConsumption = devices.reduce((acc, dev) => dev.isOn ? acc + dev.powerConsumption : acc, 0);

    return (
        <div className="animate-fade-in">
            <PageHeader title="Smart Device Control" subtitle="Manage your connected devices and monitor power consumption."/>
            <Card>
                <div className="flex justify-between items-center mb-8 p-6 rounded-lg bg-gray-800">
                    <span className="font-bold text-gray-300 text-lg">Total Consumption</span>
                    <span className={`font-black text-4xl ${totalConsumption > 2500 ? 'text-red-500' : 'text-white'}`}>{totalConsumption} W</span>
                </div>
                <div className="space-y-4">
                    {devices.map(device => (
                        <div key={device.id} className="flex items-center justify-between bg-gray-850 p-5 rounded-lg">
                            <div>
                                <p className="font-bold text-white text-lg">{device.name}</p>
                                <p className="text-sm text-gray-400">{device.type} - {device.powerConsumption}W</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={device.isOn} onChange={() => onToggle(device.id)} className="sr-only peer" />
                                <div className="w-14 h-8 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const PowerUsagePage: React.FC = () => {
    const [data, setData] = useState<PowerDataPoint[]>([]);

    useEffect(() => {
        const initialData: PowerDataPoint[] = Array.from({ length: 30 }, (_, i) => {
            const time = new Date(Date.now() - (30 - i) * 3000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
            const wattage = Math.floor(500 + Math.sin((Date.now() - (30 - i) * 3000) / 300000) * 400 + Math.random() * 200);
            return { time, wattage };
        });
        setData(initialData);

        const interval = setInterval(() => {
            setData(currentData => {
                const now = new Date();
                const time = now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
                const wattage = Math.floor(500 + Math.sin(now.getTime() / 300000) * 400 + Math.random() * 200);
                const newData = [...currentData.slice(1), { time, wattage }];
                return newData;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="animate-fade-in">
            <PageHeader title="Real-Time Power Usage" subtitle="Visualize your home's energy consumption live." />
            <Card className="h-[32rem]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9ca3af" fontSize={14} />
                        <YAxis stroke="#9ca3af" fontSize={14} unit=" W" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} labelStyle={{ color: '#d1d5db' }} itemStyle={{ color: 'white', fontWeight: 'bold' }}/>
                        <Line type="monotone" dataKey="wattage" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#ffffff' }} activeDot={{ r: 8, stroke: 'black', strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

const AutomationPage: React.FC = () => {
    const [rules, setRules] = useState(mockRules);
    
    const toggleRule = (id: string) => {
        setRules(prevRules => prevRules.map(rule => rule.id === id ? { ...rule, isEnabled: !rule.isEnabled } : rule));
    };

    return (
         <div className="animate-fade-in">
            <PageHeader title="Automation Rules" subtitle="Set up smart rules to manage power automatically."/>
            <Card>
                <div className="space-y-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between bg-gray-850 p-5 rounded-lg">
                            <div>
                                <p className="font-bold text-white text-lg">{rule.name}</p>
                                <p className="text-sm text-gray-400">{rule.description}</p>
                            </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={rule.isEnabled} onChange={() => toggleRule(rule.id)} className="sr-only peer" />
                                <div className="w-14 h-8 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const AIPredictionPage: React.FC<{devices: SmartDevice[]}> = ({ devices }) => {
    const [tips, setTips] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGetTips = async () => {
        setIsLoading(true);
        setTips([]);
        const fetchedTips = await getPowerSavingTips(devices);
        setTips(fetchedTips);
        setIsLoading(false);
    };

    return (
        <div className="animate-fade-in">
             <PageHeader title="AI Power Helper" subtitle="Get intelligent, personalized recommendations to save power."/>
             <Card>
                <div className="flex flex-col h-full">
                    <p className="text-gray-300 mb-8 text-lg">Let our AI analyze your current device usage and provide smart recommendations to optimize power consumption and save on your electricity bill.</p>
                    
                    {isLoading ? (
                        <div className="flex-grow my-4">
                            <div className="space-y-5 w-full">
                                <div className="h-5 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-5 bg-gray-800 rounded w-full animate-pulse"></div>
                                <div className="h-5 bg-gray-800 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                    ) : tips.length > 0 ? (
                        <ul className="space-y-4 my-4 text-gray-200 flex-grow">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start text-lg">
                                    <span className="text-white mr-4 mt-1">&#10148;</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex-grow flex items-center justify-center min-h-[150px] bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg my-4">
                            <p className="text-gray-500 font-semibold">Click the button to get your personalized tips.</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleGetTips} 
                        disabled={isLoading}
                        className="mt-auto w-full bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold py-4 px-4 rounded-lg transition-colors duration-300 text-lg"
                    >
                        {isLoading ? 'Analyzing...' : 'Get AI Recommendations'}
                    </button>
                </div>
             </Card>
        </div>
    );
};

const PremiumPage: React.FC = () => {
    const features = [
        { title: "Battery Life Optimization", description: "Calculates battery runtime based on current usage and planned activities to ensure you never run out of backup power unexpectedly.", icon: <IconWrapper className="bg-gray-800 text-gray-300"><BatteryIcon/></IconWrapper> },
        { title: "Solar Integration", description: "Monitors solar panels, battery charging, and grid tie-in to maximize solar usage and minimize grid dependency.", icon: <IconWrapper className="bg-gray-800 text-gray-300"><SolarIcon/></IconWrapper> },
        { title: "Neighborhood Power Sharing", description: "Connect with neighbors to share power status and coordinate usage for community resilience during extended outages.", icon: <IconWrapper className="bg-gray-800 text-gray-300"><CommunityIcon/></IconWrapper> },
    ];

    return (
         <div className="animate-fade-in">
            <PageHeader title="Premium Features" subtitle="Upgrade to unlock advanced power management tools."/>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map(feature => (
                    <Card key={feature.title} className="relative group overflow-hidden text-center items-center">
                        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full mb-4"><LockIcon /></div>
                            <h3 className="text-xl font-bold mt-2">Premium Feature</h3>
                            <button className="mt-6 bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-lg transition-colors">
                                Upgrade Now
                            </button>
                        </div>
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400 text-base">{feature.description}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [devices, setDevices] = useState<SmartDevice[]>(initialDevices);
    const [currentPage, setCurrentPage] = useState<Page>('schedule');

    const handleDeviceToggle = (id: string) => {
        setDevices(prevDevices =>
            prevDevices.map(device =>
                device.id === id ? { ...device, isOn: !device.isOn } : device
            )
        );
    };
    
    const renderPage = () => {
        switch(currentPage) {
            case 'schedule':
                return <SchedulePage schedule={mockSchedule} />;
            case 'devices':
                return <DeviceControlPage devices={devices} onToggle={handleDeviceToggle} />;
            case 'usage':
                return <PowerUsagePage />;
            case 'automation':
                return <AutomationPage />;
            case 'ai':
                return <AIPredictionPage devices={devices} />;
            case 'premium':
                return <PremiumPage />;
            default:
                return <SchedulePage schedule={mockSchedule} />;
        }
    }

    return (
        <div className="min-h-screen flex bg-black">
            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            <main className="flex-1 overflow-y-auto bg-gray-950">
                <div className="p-12 max-w-7xl mx-auto">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;