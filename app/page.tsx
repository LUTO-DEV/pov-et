'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Home() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPhotos(data);
        // Set the most recent horizontal-friendly photo as the background
        setBgImage(data[0].image_url);
      }
    };
    fetchPhotos();
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-pov-dark font-sans transition-all duration-1000">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 z-0 w-full h-full bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Light Cloudy Overlay for readability */}
      <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-3xl" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-md">pov.et</h1>
          <a href="/submit" className="text-sm font-medium tracking-wide uppercase px-4 py-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition">
            Submit POV
          </a>
        </header>

        {/* Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {photos.map((photo, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={photo.id}
              className="relative group break-inside-avoid rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl"
            >
              <img src={photo.image_url} alt="POV" className="w-full h-auto object-cover" />
              <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                <p className="text-white text-sm font-medium">{photo.caption}</p>
                <p className="text-white/70 text-xs">📸 {photo.author_credit}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}