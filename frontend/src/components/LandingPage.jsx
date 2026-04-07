import React from 'react';
import { BookOpen } from 'lucide-react';
import Auth from './Auth';

export default function LandingPage({ supabase }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFBF7]">
      {/* Absolute Header for Transparency over Hero */}
      <header className="absolute top-0 w-full z-20 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <BookOpen className="text-white drop-shadow-md w-7 h-7" />
           <h1 className="text-2xl font-bold tracking-tight text-white font-serif drop-shadow-md">
             Let Me Tell You
           </h1>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-grow flex flex-col lg:flex-row relative">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/heritage-bg.png" 
            alt="Vintage family history background" 
            className="w-full h-full object-cover object-center"
          />
          {/* A gradient overlay to make text and form readable, simulating the MyHeritage style */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        </div>

        {/* Left Side: Hero Text */}
        <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 pt-32 pb-16 text-white min-h-[60vh] lg:min-h-screen">
          <h2 className="text-5xl lg:text-7xl font-bold font-serif mb-6 leading-tight text-shadow text-[#FDFBF7]">
            Preserve Your Family's Greatest Stories.
          </h2>
          <p className="text-xl lg:text-2xl text-stone-200 mb-8 max-w-xl leading-relaxed text-shadow">
            Discover, record, and share the precious memories that make your family unique. A digital heirloom for generations to come.
          </p>
          <div className="flex items-center gap-4 text-stone-300 font-medium">
            <span className="flex items-center gap-2"><div className="w-8 h-px bg-stone-300"></div> Start building your legacy</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center lg:justify-end px-4 lg:px-16 pb-16 lg:pb-0 pt-8 lg:pt-0">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-xl shadow-2xl overflow-hidden shadow-black/30 border border-stone-200/50">
            <Auth supabase={supabase} />
          </div>
        </div>
      </main>
    </div>
  );
}
