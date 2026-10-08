import { Star } from 'lucide-react';
import { useState } from 'react';

const StarRatingInput = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={`h-6 w-6 ${
              (hover || value) >= n ? 'fill-pink-400 text-pink-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;