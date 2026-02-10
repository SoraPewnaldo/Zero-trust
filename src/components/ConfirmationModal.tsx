import { XCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'border-red-500/30 bg-red-500/5',
        warning: 'border-yellow-500/30 bg-yellow-500/5',
        info: 'border-white/30 bg-white/5'
    };

    const buttonStyles = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
        info: 'bg-white hover:bg-white/90 text-black'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`border ${variantStyles[variant]} max-w-md w-full p-6 shadow-2xl`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <XCircle size={20} className="text-white/70" />
                    <h2 className="text-sm font-mono text-white/90 tracking-wider uppercase">
                        {title}
                    </h2>
                </div>

                {/* Message */}
                <p className="text-sm font-mono text-white/70 mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-xs font-mono text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-colors tracking-wider"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-xs font-mono font-bold transition-colors tracking-wider ${buttonStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
