import { MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div 
        className="relative flex flex-col items-center justify-center bg-cover bg-center px-4 text-center py-24 flex-1"
        style={{ backgroundImage: `url('/image.jpeg')` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="mb-4 rounded-2xl bg-trippal-600 p-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white drop-shadow-md">
            Find what locals actually love
          </h1>
          <p className="mt-4 max-w-md text-white text-lg drop-shadow-md">
            Hyperlocal discovery within your custom radius — ranked by real review depth, not just star count.
          </p>
          <Link to="/search" className="mt-8">
            <Button className="gap-2 px-6 py-3 text-base shadow-lg">
              <Search className="h-5 w-5" />
              Start exploring
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;