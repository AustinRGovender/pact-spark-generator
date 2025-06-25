
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-24 w-24 text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Page Not Found</h1>
        <p className="text-slate-600 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#bbc7fe]/20 hover:bg-[#bbc7fe]/30 
                   text-slate-700 rounded-xl transition-all duration-200 border border-[#bbc7fe]/30"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
