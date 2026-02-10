import { useState } from 'react';
import { X, Save, Key, Mail, User, Briefcase, Shield } from 'lucide-react';

interface EmployeeFormProps {
    onClose: () => void;
    onSuccess: () => void;
    api: {
        admin: {
            createUser: (data: unknown) => Promise<unknown>;
        };
    };
}

export default function EmployeeForm({ onClose, onSuccess, api }: EmployeeFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        department: 'Engineering',
        role: 'employee',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await api.admin.createUser({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                firstName: formData.firstName,
                lastName: formData.lastName,
                department: formData.department,
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to create user:', err);
            const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#0A0A0A] border border-white/20 w-full max-w-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-mono text-white tracking-wider flex items-center gap-2">
                        <User size={18} className="text-white/70" />
                        ADD NEW EMPLOYEE
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs font-mono">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">First Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-3 focus:outline-none focus:border-white/50"
                                    placeholder="John"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Last Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-3 focus:outline-none focus:border-white/50"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Username</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-2.5 text-white/30" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                placeholder="john.doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Email Address</label>
                        <div className="relative">
                            <Mail size={14} className="absolute left-3 top-2.5 text-white/30" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                placeholder="john.doe@soraiam.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Department</label>
                            <div className="relative">
                                <Briefcase size={14} className="absolute left-3 top-2.5 text-white/30" />
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                >
                                    <option value="Engineering">Engineering</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Finance">Finance</option>
                                    <option value="IT Security">IT Security</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Role</label>
                            <div className="relative">
                                <Shield size={14} className="absolute left-3 top-2.5 text-white/30" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Password</label>
                            <div className="relative">
                                <Key size={14} className="absolute left-3 top-2.5 text-white/30" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider uppercase">Confirm Password</label>
                            <div className="relative">
                                <Key size={14} className="absolute left-3 top-2.5 text-white/30" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 text-white font-mono text-xs px-3 py-2 pl-9 focus:outline-none focus:border-white/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-xs font-mono text-black bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? 'CREATING...' : (
                                <>
                                    <Save size={14} />
                                    CREATE EMPLOYEE
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
