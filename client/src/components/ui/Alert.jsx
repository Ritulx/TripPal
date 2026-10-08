import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const VARIANTS = {
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-pink-50',
    text: 'text-trippal-800',
    icon: CheckCircle2,
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    icon: Info,
  },
};

const Alert = ({ variant = 'info', children, onDismiss }) => {
  const { bg, text, icon: Icon } = VARIANTS[variant];

  return (
    <div className={`flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${bg} ${text}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;