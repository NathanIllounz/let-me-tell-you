import React, { useEffect, useRef, useState } from 'react';
import { Feather, BookOpen, Mic, Palette, Headphones, Network, ChevronDown } from 'lucide-react';
import Auth from './Auth';

// Intersection Observer Hook for Cinematic Fading
function FadeInSection({ children, delay = 0, slide = true }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.1 });

    const { current } = domRef;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [delay]);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${slide ? 'transform' : ''} ${
        isVisible ? 'opacity-100 translate-y-0' : `opacity-0 ${slide ? 'translate-y-8' : ''}`
      }`}
    >
      {children}
    </div>
  );
}

export default function LandingPage({ supabase }) {
  return (
    <div className="flex flex-col font-sans bg-[#FDFBF7] overflow-x-hidden">
      
      {/* Absolute Header for Transparency over Hero */}
      <header className="absolute top-0 w-full z-30 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
           {/* Composite Logo */}
           <div className="relative w-12 h-12 flex items-center justify-center p-2 bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-white/20">
             <BookOpen className="text-white/80 w-6 h-6 absolute mt-2 ml-1" strokeWidth={1.5} />
             <Feather className="text-white w-7 h-7 absolute -mt-3 mr-2 rotate-[15deg] drop-shadow-md" strokeWidth={2.5} />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-white font-serif drop-shadow-md">
             Let Me Tell You
           </h1>
        </div>
      </header>
      
      {/* SECTION 1: Welcome Hero (Sticky or Min-H-Screen relative) */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center pt-24 pb-16 lg:pt-0 lg:pb-0">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 bg-black">
          <img 
            src="/heritage-bg.png" 
            alt="Vintage family history background" 
            className="w-full h-full object-cover object-[25%_center] opacity-90"
          />
          {/* Extremely light ambient lighting mask (10% visible) to preserve text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4a3219]/30 via-[#3a2613]/10 to-transparent"></div>
          {/* Blend smoothly into the dark section below it */}
          <div className="absolute w-full h-32 bottom-0 bg-gradient-to-t from-[#2c241b] via-[#2c241b]/60 to-transparent"></div>
        </div>

        {/* Left Side: Hero Text */}
        <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 mt-10 lg:mt-0 lg:min-h-screen">
          <FadeInSection delay={100} slide={false}>
            <h2 className="text-5xl lg:text-7xl font-bold font-serif mb-6 leading-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              Preserve Your Family's Greatest Stories.
            </h2>
          </FadeInSection>
          <FadeInSection delay={300} slide={false}>
            <p className="text-xl lg:text-2xl text-stone-200 mb-10 max-w-xl leading-relaxed drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Discover, record, and intimately share the precious memories that make you who you are. A beautiful digital heirloom for generations to come.
            </p>
          </FadeInSection>
          <FadeInSection delay={500} slide={false}>
            <div className="flex items-center gap-4 text-stone-300 font-medium">
              <span className="flex items-center gap-3 uppercase tracking-widest text-xs font-bold drop-shadow-md">
                <div className="w-12 h-px bg-stone-300"></div> 
                Begin Building Your Legacy
              </span>
            </div>
          </FadeInSection>
        </div>

        {/* Right Side: Auth Form */}
        <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center lg:justify-end px-4 lg:px-16 mt-16 lg:mt-0 pb-16 lg:pb-0">
          <FadeInSection delay={300} slide={false}>
            <div className="w-full max-w-md bg-[#FDFBF7] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 relative">
              <Auth supabase={supabase} />
            </div>
          </FadeInSection>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-[#5c4a3d] animate-bounce hidden lg:block">
           <ChevronDown className="w-8 h-8 opacity-60" />
        </div>
      </section>

      {/* SECTION 2: Our Services (How we process memories) */}
      <section className="py-24 px-8 lg:px-16 bg-[#2c241b] text-[#FDFBF7] relative z-20 border-t-4 border-[#3a3025]">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
               <div className="flex justify-center mb-6">
                  <div className="w-px h-12 bg-white/20"></div>
               </div>
              <h3 className="text-[#a4917a] uppercase tracking-widest font-bold text-sm mb-3">Magical Technology</h3>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-[#FDFBF7]">Everything needed to immortalize a memory.</h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FadeInSection delay={0}>
              <div className="bg-[#3a3025] hover:bg-[#45392d] p-8 rounded-2xl shadow-xl transition-all duration-300 group h-full border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-[#2c241b] text-[#ddcbb5] rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-inner">
                  <Mic className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">AI Ghostwriter</h4>
                <p className="text-[#b5a38f] leading-relaxed font-medium">Just speak naturally into your phone. Our Ghostwriter takes your wandering thoughts and elegantly formats them into a polished memoir chapter.</p>
              </div>
            </FadeInSection>
            
            <FadeInSection delay={200}>
              <div className="bg-[#3a3025] hover:bg-[#45392d] p-8 rounded-2xl shadow-xl transition-all duration-300 group h-full border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-[#2c241b] text-[#ddcbb5] rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-inner">
                  <Palette className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Bespoke Illustrator</h4>
                <p className="text-[#b5a38f] leading-relaxed font-medium">No stock photos here. Every story receives beautifully customized, generative painted cover art complete with premium typography printed on the cover.</p>
              </div>
            </FadeInSection>

            <FadeInSection delay={400}>
              <div className="bg-[#3a3025] hover:bg-[#45392d] p-8 rounded-2xl shadow-xl transition-all duration-300 group h-full border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-[#2c241b] text-[#ddcbb5] rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-inner">
                  <Headphones className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">Studio Narrator</h4>
                <p className="text-[#b5a38f] leading-relaxed font-medium">Too tired to read? Listen to your family's stories on the go, narrated automatically by hyper-realistic AI voices in over 40 different languages.</p>
              </div>
            </FadeInSection>

            <FadeInSection delay={600}>
              <div className="bg-[#3a3025] hover:bg-[#45392d] p-8 rounded-2xl shadow-xl transition-all duration-300 group h-full border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="w-14 h-14 bg-[#2c241b] text-[#ddcbb5] rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-inner">
                  <Network className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-white">The Social Graph</h4>
                <p className="text-[#b5a38f] leading-relaxed font-medium">Form private "Family Circles" or share direct secure handles with friends. Your legacy remains totally private until you decide to bridge the connection.</p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Full Bleed Image Break */}
      <section className="h-[50vh] w-full relative z-10">
        <div className="absolute inset-0 bg-[#2c241b]">
           <img 
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
              alt="Vintage Library Bookshelf" 
              className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
              style={{ backgroundAttachment: 'fixed' }}
           />
           {/* Top gradient connecting firmly back to Services */}
           <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-[#2c241b] via-[#2c241b]/80 to-transparent"></div>
           {/* Bottom gradient connecting firmly into the cream Example 1 block */}
           <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent"></div>
        </div>
      </section>

      {/* SECTION 3: Use Cases (Why Use It?) */}
      <div className="bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 pt-10 pb-20">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-stone-800 drop-shadow-sm">Your life is worth recording.</h2>
            </div>
          </FadeInSection>
        </div>
      </div>

      {/* Example 1 - Grandparents (Warm Cream Block) */}
      <section className="py-20 lg:py-32 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={100}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500">
                  <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply z-10 hidden lg:block hover:bg-transparent transition-colors duration-500"></div>
                  <img src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Grandparent Interview" className="w-full h-[400px] object-cover" />
                </div>
              </FadeInSection>
            </div>
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={300}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-1.5 bg-[#F3EBE1] text-[#6B8569] font-bold text-xs uppercase tracking-widest rounded-full">Archive</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold font-serif text-stone-800 mb-6">Interview the previous generation.</h3>
                <p className="text-lg text-stone-500 leading-relaxed">
                  Capture history before it slowly fades away. Sit down with a phone over coffee, press record, and easily archive an entire lifetime of memories in their own unscripted words.
                </p>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* Example 2 - Bedtime (Midnight Blue Block) */}
      <section className="py-20 lg:py-32 bg-[#1a252c] text-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={100}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500 border border-white/10">
                  <div className="absolute inset-0 bg-[#1a252c]/20 mix-blend-multiply z-10 hidden lg:block hover:bg-transparent transition-colors duration-500"></div>
                  <img src="/child_dreaming.png" alt="Bedtime Stories" className="w-full h-[450px] object-cover" />
                </div>
              </FadeInSection>
            </div>
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={300}>
                 <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-1.5 bg-[#2c3e50] text-[#86a6c1] font-bold text-xs uppercase tracking-widest rounded-full border border-[#34495e]">Imagination</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold font-serif text-white mb-6">The definitive bedtime story collection.</h3>
                <p className="text-lg text-[#86a6c1] leading-relaxed">
                  Parents can easily record the wild, totally improvised tales they make up for their kids every night. Our app binds them with beautiful AI art, making them feel like real published books in the gallery.
                </p>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* Example 3 - Recipes (Soft Sage Block) */}
      <section className="py-20 lg:py-32 bg-[#f0f4f0]">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={100}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500 border border-stone-200">
                  <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay z-10 hidden lg:block hover:bg-transparent transition-colors duration-500"></div>
                  <img src="/italian_family.png" alt="Family Recipes" className="w-full h-[400px] object-cover" />
                </div>
              </FadeInSection>
            </div>
            <div className="w-full lg:w-1/2">
              <FadeInSection delay={300}>
                 <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-1.5 bg-stone-100 text-stone-600 font-bold text-xs uppercase tracking-widest rounded-full">Culture</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold font-serif text-stone-800 mb-6">Preserve the sacred recipes.</h3>
                <p className="text-lg text-stone-500 leading-relaxed">
                  Document the chaotic, beautiful history of *why* Aunt Marie's lasagna is famous. Record the recipe alongside the actual story of the kitchen disasters that led to it.
                </p>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA (Dark contrast) */}
      <section className="py-24 bg-[#1e1a17] border-t border-[#3a3025]">
        <div className="max-w-4xl mx-auto px-8 text-center flex flex-col items-center">
           <FadeInSection>
              <div className="relative w-16 h-16 flex items-center justify-center p-3 bg-gradient-to-br from-[#c9a174] to-[#8F7C6B] rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.6)] border border-white/10 mb-8 mx-auto">
                 <BookOpen className="text-[#1e1a17]/50 w-8 h-8 absolute mt-2 ml-1" strokeWidth={2} />
                 <Feather className="text-[#1e1a17] w-10 h-10 absolute -mt-4 mr-2 rotate-[15deg] drop-shadow-md" strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-serif font-bold text-white mb-4">Protect your memories with</h2>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold text-[#c9a174] mb-8 drop-shadow-lg">Let Me Tell You</h1>
              <p className="text-[#a4917a] text-lg mb-12 max-w-lg mx-auto font-medium tracking-wide">Scroll back up to sign in and start building your family's definitive, secure library.</p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-10 py-5 bg-[#c9a174] hover:bg-[#b08d66] text-[#1e1a17] rounded-xl font-bold transition-all shadow-xl hover:shadow-[0_0_40px_rgba(201,161,116,0.3)] hover:-translate-y-1 tracking-widest uppercase text-sm"
              >
                Sign In Now
              </button>
           </FadeInSection>
        </div>
      </section>
      
      <footer className="footer py-8 bg-black text-stone-500 text-center text-sm">
         <p>© {new Date().getFullYear()} Let Me Tell You. A digital heirloom project.</p>
      </footer>
    </div>
  );
}
