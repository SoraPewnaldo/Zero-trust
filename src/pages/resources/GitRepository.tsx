import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, GitCommit, GitPullRequest, Star, Clock } from 'lucide-react';

export default function GitRepository() {
    return (
        <DashboardLayout title="GIT REPOSITORY" subtitle="SOURCE CODE MANAGEMENT">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Repositories List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white/60 font-mono text-sm">RECENT REPOSITORIES</h3>
                        <button className="text-xs bg-green-600/20 text-green-400 px-3 py-1 border border-green-600/50 hover:bg-green-600/30 transition-colors">
                            + NEW REPO
                        </button>
                    </div>

                    {[
                        { name: 'soraiam-backend', lang: 'TypeScript', stars: 124, updated: '2 hours ago' },
                        { name: 'soraiam-frontend', lang: 'React', stars: 98, updated: '4 hours ago' },
                        { name: 'trust-engine-pdp', lang: 'Python', stars: 45, updated: 'Yesterday' },
                        { name: 'infrastructure-iac', lang: 'HCL', stars: 12, updated: '3 days ago' }
                    ].map((repo, idx) => (
                        <div key={idx} className="p-4 border border-white/10 bg-black/40 hover:bg-white/5 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-blue-400 group-hover:underline">{repo.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 border border-white/10 rounded-full text-white/40">{repo.lang}</span>
                                    </div>
                                    <div className="text-xs text-white/40">Updated {repo.updated}</div>
                                </div>
                                <div className="flex items-center gap-1 text-white/40">
                                    <Star size={14} />
                                    <span className="text-xs">{repo.stars}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white/60" />
                                ACTIVITY FEED
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { user: 'sora', action: 'pushed to', target: 'main', repo: 'soraiam-backend', time: '10m ago', icon: GitCommit },
                                { user: 'sarah.j', action: 'opened PR', target: 'feat/mfa', repo: 'soraiam-frontend', time: '1h ago', icon: GitPullRequest },
                                { user: 'mike.c', action: 'merged', target: 'fix/auth', repo: 'trust-engine', time: '3h ago', icon: GitBranch },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <div className="mt-1"><item.icon size={14} className="text-white/40" /></div>
                                    <div>
                                        <p className="text-white/80">
                                            <span className="font-bold text-white">{item.user}</span> {item.action} <span className="font-mono text-blue-300">{item.target}</span>
                                        </p>
                                        <p className="text-xs text-white/40">on {item.repo} • {item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="text-md font-mono">YOUR STATS</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold font-mono">1,204</div>
                                <div className="text-xs text-white/40">Commits</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-mono">42</div>
                                <div className="text-xs text-white/40">PRs Merged</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </DashboardLayout>
    );
}
