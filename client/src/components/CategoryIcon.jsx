import { getCategoryStyle } from '../utils/categoryStyles';

const SIZES = {
  sm: { box: 'h-8 w-8', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14', icon: 'h-6 w-6' },
};

const CategoryIcon = ({ slug, size = 'md' }) => {
  const { icon: Icon, bg, text } = getCategoryStyle(slug);
  const { box, icon } = SIZES[size];
  return (
    <div className={`flex ${box} shrink-0 items-center justify-center rounded-xl ${bg}`}>
      <Icon className={`${icon} ${text}`} />
    </div>
  );
};

export default CategoryIcon;