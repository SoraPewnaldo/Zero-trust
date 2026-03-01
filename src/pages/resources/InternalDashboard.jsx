import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Calendar, Users, Megaphone } from 'lucide-react';

export default function InternalDashboard() {
    return (
        <DashboardLayout title="INTERNAL DASHBOARD" subtitle="COMPANY INTRANET & NEWS">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main News Feed */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-mono">
                                <Megaphone className="h-5 w-5 text-blue-400" />
                                COMPANY ANNOUNCEMENTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border border-white/5 bg-white/5 rounded">
                                <h3 className="font-bold text-blue-300 mb-1">Q4 All-Hands Meeting</h3>
                                <p className="text-sm text-white/60 mb-2">Join us this Friday for the quarterly review and roadmap discussion.</p>
                                <div className="text-xs text-white/40 font-mono">Posted 2 hours ago by Sarah J.</div>
                            </div>
                            <div className="p-4 border border-white/5 bg-white/5 rounded">
                                <h3 className="font-bold text-green-300 mb-1">New Security Policy Enforcement</h3>
                                <p className="text-sm text-white/60 mb-2">Please review the updated zero-trust guidelines relating to personal device usage.</p>
                                <div className="text-xs text-white/40 font-mono">Posted yesterday by IT Sec</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-mono">
                                <Newspaper className="h-5 w-5 text-purple-400" />
                                DEPARTMENT UPDATES
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-sm text-white/80">Engineering launched v2.4.0</span>
                                    <span className="text-xs text-white/40">Today</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-sm text-white/80">Marketing started Q1 Campaign</span>
                                    <span className="text-xs text-white/40">Yesterday</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-sm text-white/80">HR finalized new benefits package</span>
                                    <span className="text-xs text-white/40">2 days ago</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-md font-mono">
                                <Calendar className="h-4 w-4 text-orange-400" />
                                UPCOMING EVENTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <div className="bg-white/10 p-2 rounded text-center min-w-[3rem]">
                                    <div className="text-xs text-white/50">NOV</div>
                                    <div className="font-bold text-lg">15</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Tech Talk: Zero Trust</div>
                                    <div className="text-xs text-white/50">14:00 - Main Hall</div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="bg-white/10 p-2 rounded text-center min-w-[3rem]">
                                    <div className="text-xs text-white/50">NOV</div>
                                    <div className="font-bold text-lg">22</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold">Thanksgiving Potluck</div>
                                    <div className="text-xs text-white/50">12:00 - Cafeteria</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-md font-mono">
                                <Users className="h-4 w-4 text-pink-400" />
                                QUICK LINKS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <button className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">IT Support Ticket</button>
                            <button className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">Employee Directory</button>
                            <button className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">Expense Reports</button>
                            <button className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">Travel Booking</button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
