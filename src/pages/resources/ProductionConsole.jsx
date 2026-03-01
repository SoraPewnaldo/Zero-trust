import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Activity, Globe, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ProductionConsole() {
    return (
        <DashboardLayout title="PRODUCTION CLOUD CONSOLE" subtitle="AWS US-EAST-1 REGION">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="bg-black/40 border-white/10 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs text-white/50 mb-1">ACTIVE INSTANCES</div>
                        <div className="text-3xl font-mono font-bold text-green-400">24</div>
                        <div className="text-xs text-green-400/50 mt-1 flex items-center gap-1">
                            <Activity size={12} />
                            <span>All Healthy</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs text-white/50 mb-1">CPU UTILIZATION</div>
                        <div className="text-3xl font-mono font-bold text-blue-400">42%</div>
                        <div className="text-xs text-blue-400/50 mt-1">Avg over 1h</div>
                    </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs text-white/50 mb-1">MEMORY USAGE</div>
                        <div className="text-3xl font-mono font-bold text-purple-400">68%</div>
                        <div className="text-xs text-purple-400/50 mt-1">Stable</div>
                    </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/10 text-white">
                    <CardContent className="pt-6">
                        <div className="text-xs text-white/50 mb-1">S3 BUCKETS</div>
                        <div className="text-3xl font-mono font-bold text-orange-400">12</div>
                        <div className="text-xs text-orange-400/50 mt-1">1.4 TB Total</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2">
                                <Server className="text-white/60" />
                                INSTANCE STATUS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-3 font-normal">Instance ID</th>
                                        <th className="text-left p-3 font-normal">Type</th>
                                        <th className="text-left p-3 font-normal">Zone</th>
                                        <th className="text-left p-3 font-normal">State</th>
                                        <th className="text-left p-3 font-normal">Status Checks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[
                                        { id: 'i-0a1b2c3d4e5f67890', type: 't3.micro', zone: 'us-east-1a', state: 'running' },
                                        { id: 'i-0f9e8d7c6b5a43210', type: 'm5.large', zone: 'us-east-1b', state: 'running' },
                                        { id: 'i-0123456789abcdef0', type: 'c5.xlarge', zone: 'us-east-1a', state: 'running' },
                                        { id: 'i-0fedcba9876543210', type: 't3.small', zone: 'us-east-1c', state: 'stopped' },
                                        { id: 'i-0a1b2c3d4e5f67891', type: 'r5.2xlarge', zone: 'us-east-1b', state: 'running' },
                                    ].map((inst, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono text-blue-300">{inst.id}</td>
                                            <td className="p-3 text-white/70">{inst.type}</td>
                                            <td className="p-3 text-white/50">{inst.zone}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded textxs ${inst.state === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                                                    {inst.state}
                                                </span>
                                            </td>
                                            <td className="p-3 text-green-400 flex items-center gap-1">
                                                <ShieldCheck size={14} />
                                                2/2 passed
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2">
                                <Globe className="text-white/60" />
                                NETWORK TRAFFIC
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Fake Chart Bars */}
                            <div className="h-32 flex items-end justify-between gap-1">
                                {[40, 65, 30, 80, 55, 90, 45, 60, 75, 50, 85, 95].map((h, i) => (
                                    <div key={i} className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors relative group">
                                        <div style={{ height: `${h}%` }} className="bg-blue-500 w-full absolute bottom-0"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-white/30 mt-2 font-mono">
                                <span>10:00</span>
                                <span>11:00</span>
                                <span>12:00</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-500/5 border-yellow-500/20 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2 text-yellow-400">
                                <AlertTriangle className="h-4 w-4" />
                                SYSTEM ALERTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-xs text-yellow-200/80 p-2 border border-yellow-500/20 bg-yellow-500/10 rounded">
                                <strong>RDS Latency Spike</strong>
                                <br />database-1 write latency &gt; 100ms
                            </div>
                            <div className="text-xs text-white/60 p-2 border border-white/10 bg-white/5 rounded">
                                <strong>Auto-Scaling Group</strong>
                                <br />Scaled up to 5 instances
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
