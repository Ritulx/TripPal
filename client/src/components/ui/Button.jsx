const VARIANT_STYLES = {
  primary: 'bg-pink-200 text-black font-medium hover:bg-pink-300 focus:ring-pink-400 shadow-sm transition-colors',
  secondary: 'bg-green-300 text-white font-medium hover:bg-green-400 focus:ring-green-500 shadow-sm transition-colors',
  danger: 'bg-red-600 text-white font-medium hover:bg-red-700 focus:ring-red-500 shadow-sm transition-colors',
  ghost: 'bg-transparent text-black hover:bg-pink-50 focus:ring-pink-400 transition-colors',
};

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed
        disabled:opacity-60 ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};

export default Button;