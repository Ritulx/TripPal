const Input = ({ label, error, id, className = '', ...rest }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-trippal-500 focus:border-transparent
          ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;