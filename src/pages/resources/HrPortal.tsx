import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText, Calendar, DollarSign, PieChart } from 'lucide-react';

export default function HrPortal() {
    return (
        <DashboardLayout title="HR PORTAL" subtitle="HUMAN RESOURCES MANAGEMENT">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Profile Summary */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white text-center">
                        <CardContent className="pt-8">
                            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <User size={48} className="text-white/40" />
                            </div>
                            <h2 className="text-xl font-bold font-mono">Sarah Johnson</h2>
                            <p className="text-white/50 text-sm">Senior Engineer</p>
                            <div className="mt-4 flex justify-center gap-2 text-xs text-white/40">
                                <span className="px-2 py-1 border border-white/10 rounded">EMP-1023</span>
                                <span className="px-2 py-1 border border-white/10 rounded">Engineering</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-pink-400" />
                                LEAVE BALANCE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Annual Leave</span>
                                    <span className="text-green-400">12 Days</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-3/4"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Sick Leave</span>
                                    <span className="text-yellow-400">5 Days</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-1/2"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-black/40 border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded text-blue-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">Documents</div>
                                    <div className="text-xs text-white/50">Policies & Contracts</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-black/40 border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 rounded text-green-400">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold">Payslips</div>
                                    <div className="text-xs text-white/50">View & Download</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-white/60" />
                                TIME OFF REQUESTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm text-left">
                                <thead className="text-white/40 border-b border-white/10">
                                    <tr>
                                        <th className="pb-2 font-normal">Dates</th>
                                        <th className="pb-2 font-normal">Type</th>
                                        <th className="pb-2 font-normal">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="py-3">Dec 24 - Dec 31</td>
                                        <td className="py-3">Annual Leave</td>
                                        <td className="py-3 text-yellow-400">Pending</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3">Nov 15</td>
                                        <td className="py-3">Sick Leave</td>
                                        <td className="py-3 text-green-400">Approved</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3">Aug 10 - Aug 15</td>
                                        <td className="py-3">Annual Leave</td>
                                        <td className="py-3 text-green-400">Approved</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-900/10 border-purple-500/20 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono text-purple-300">OPEN ENROLLMENT</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-white/70 mb-4">
                                Benefits open enrollment for 2026 is now open. Please review your selections by Nov 30th.
                            </p>
                            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors">
                                START ENROLLMENT
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
