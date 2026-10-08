const RadiusSlider = ({ value, onChange, min = 0.5, max = 40 }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Search radius</label>
        <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-sm font-semibold text-trippal-700">
          {value} km
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-pink-300"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min} km</span>
        <span>40 km max</span>
      </div>
    </div>
  );
};

export default RadiusSlider;