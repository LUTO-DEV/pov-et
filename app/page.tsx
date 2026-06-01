'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Eye, Camera, Search, Heart, Share2 } from 'lucide-react';
import JSZip from 'jszip';

export default function Home() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [photographerPhotos, setPhotographerPhotos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPhotos, setLikedPhotos] = useState<string[]>([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Tracks initial database sync

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const { data } = await supabase
          .from('photos')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setPhotos(data);
          setFilteredPhotos(data);
        }
      } catch (err) {
        console.error("Error reading archive:", err);
      } finally {
        setIsLoading(false); // Gracefully kill loader once data drops
      }
    };
    fetchPhotos();

    const savedLikes = localStorage.getItem('pov_liked_photos');
    if (savedLikes) setLikedPhotos(JSON.parse(savedLikes));
  }, []);

  // Filter computation loop
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(
        (p) =>
          p.author_credit?.toLowerCase().includes(query) ||
          p.caption?.toLowerCase().includes(query)
      );
      setFilteredPhotos(filtered);
    }
  }, [searchQuery, photos]);

  // FIX: Reset bgIndex to 0 whenever filteredPhotos changes to prevent index-out-of-bounds crashes
  useEffect(() => {
    setBgIndex(0);
    if (filteredPhotos.length <= 1) return;

    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % filteredPhotos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [filteredPhotos]);

  // Fetch concurrent photos from the same photographer when lightbox opens
  useEffect(() => {
    if (!selectedPhoto) {
      setPhotographerPhotos([]);
      return;
    }
    const fetchAuthorArchive = async () => {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('author_credit', selectedPhoto.author_credit)
        .eq('status', 'approved');
      if (data) {
        setPhotographerPhotos(data);
      }
    };
    fetchAuthorArchive();
  }, [selectedPhoto]);

  const toggleLike = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedLikes = [...likedPhotos];
    if (updatedLikes.includes(photoId)) {
      updatedLikes = updatedLikes.filter((id) => id !== photoId);
    } else {
      updatedLikes.push(photoId);
    }
    setLikedPhotos(updatedLikes);
    localStorage.setItem('pov_liked_photos', JSON.stringify(updatedLikes));
  };

  const sharePhoto = async (photo: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareText = `Check out this POV by ${photo.author_credit} on pov.et!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'all povs',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(`${window.location.href}?photo=${photo.id || ''}`);
      alert('Link copied to clipboard!');
    }
  };

  const downloadWithCredit = (imageUrl: string, author: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const fontSize = Math.max(22, Math.floor(img.width * 0.022));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';

      const watermarkText = `📸 ${author} via pov.et`;
      ctx.fillText(watermarkText, canvas.width - ctx.measureText(watermarkText).width - (fontSize * 1.5), canvas.height - (fontSize * 1.5));

      const downloadLink = document.createElement('a');
      downloadLink.download = `pov_et_${author}.jpg`;
      downloadLink.href = canvas.toDataURL('image/jpeg', 0.95);
      downloadLink.click();
    };
  };

  // Automated watermarked ZIP compiler engine
  const downloadEntireArchive = async (author: string) => {
    setIsZipping(true);
    const zip = new JSZip();
    const folderName = `${author.replace('@', '')}_pov_et_archive`;
    const imgFolder = zip.folder(folderName);

    try {
      const watermarkPromises = photographerPhotos.map((photo, index) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = photo.image_url;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(); return; }

            ctx.drawImage(img, 0, 0);
            const fontSize = Math.max(22, Math.floor(img.width * 0.022));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffffff';

            const watermarkText = `📸 ${author} via pov.et`;
            ctx.fillText(watermarkText, canvas.width - ctx.measureText(watermarkText).width - (fontSize * 1.5), canvas.height - (fontSize * 1.5));

            canvas.toBlob((blob) => {
              if (blob) {
                imgFolder?.file(`frame_${index + 1}_by_${author.replace('@', '')}.jpg`, blob);
              }
              resolve();
            }, 'image/jpeg', 0.95);
          };
          img.onerror = () => resolve();
        });
      });

      await Promise.all(watermarkPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      link.click();
    } catch (err) {
      console.error("Bulk archive packaging broken:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const currentBgUrl = filteredPhotos[bgIndex]?.image_url || '';

  // FULL SCREEN GLASSMORPHIC ARCHIVE INITIALIZER
  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl text-center shadow-2xl">
          <span className="font-mono text-xs text-neutral-400 tracking-[0.25em] uppercase block animate-pulse">
            ⚡ Synchronizing Grid Frames...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-neutral-900 bg-neutral-950">

      {/* Dynamic Ambient Background Canvas */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none transition-all duration-1000 ease-in-out">
        {currentBgUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 transition-all duration-1000 blur-[5px]"
            style={{ backgroundImage: `url(${currentBgUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-3xl transition-all" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col min-h-screen">

        {/* Integrated Action Navigation Header */}
        <header className="flex items-center justify-between gap-3 sm:gap-6 mb-20 bg-white/10 backdrop-blur-xl border border-white/10 p-2 sm:px-4 sm:py-3 rounded-2xl shadow-2xl w-full h-14 sm:h-16">

          {/* Left Wing: Logo */}
          <div className="flex items-center shrink-0 pl-1 sm:pl-0">
            <img
              src="/logo.png"
              alt="pov.et logo"
              className="h-7 sm:h-8 w-auto object-contain rounded-lg"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>

          {/* Center Wing: Perfectly Aligned Search Engine */}
          <div className="flex-1 max-w-xs md:max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search frames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl h-9 sm:h-10 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-white/20 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Right Wing: Submit Link with Matching Height Geometry */}
          <a
            href="/submit"
            className="text-[10px] sm:text-xs font-bold uppercase px-3 sm:px-5 h-9 sm:h-10 flex items-center justify-center bg-white text-black rounded-xl hover:bg-neutral-200 transition-all shadow-md shrink-0 whitespace-nowrap tracking-wide"
          >
            Submit POV
          </a>
        </header>

        {/* Completely Centered Typography Hero Workspace */}
        <section className="mb-20 max-w-3xl mx-auto text-center flex flex-col items-center justify-center text-white drop-shadow-xl">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-tight">
            The Visual Archive of <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-orange-300 to-amber-400">Ethiopian Life</span>
          </h1>
          <p className="text-neutral-200 text-sm sm:text-base font-light leading-relaxed max-w-xl">
            Raw, user-credited perspectives captured directly from the grid. From rainy nights on Bole Road to morning vibes in Debre Zeit.
          </p>
        </section>

        {/* Fluid Masonry Grid Interface */}
        {filteredPhotos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-white/40 py-20">
            <Camera className="w-12 h-12 mb-2 stroke-1" />
            <p className="text-sm tracking-wide">No frames match your discovery metrics...</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:balance] mb-16">
            {filteredPhotos.map((photo, i) => {
              const isLiked = likedPhotos.includes(photo.id);
              return (
                <motion.div
                  key={photo.id || i}
                  onClick={() => setSelectedPhoto(photo)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.01, 0.2) }}
                  className="relative break-inside-avoid rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg group cursor-zoom-in hover:border-white/30 hover:scale-[1.01] transition-all duration-300"
                >
                  <img src={photo.image_url} alt="" className="w-full h-auto object-cover" loading="lazy" />

                  {/* Floating Action Utilities */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <button onClick={(e) => toggleLike(photo.id, e)} className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors">
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                    <button onClick={(e) => sharePhoto(photo, e)} className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 text-white">
                    <p className="text-xs font-light line-clamp-2 mb-1">{photo.caption}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">{photo.author_credit}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Spatial Focus Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col md:flex-row items-center justify-center p-4 md:p-12 gap-6"
          >
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-6 right-6 p-2.5 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-50">
              <X className="w-5 h-5" />
            </button>

            {/* Left Box Workspace: Focus Frame + Horizontal Streaming Carousel */}
            <div className="flex-1 max-w-4xl w-full flex flex-col items-center justify-center gap-6">
              <div className="max-w-full max-h-[50vh] md:max-h-[65vh] flex items-center justify-center">
                <img src={selectedPhoto.image_url} alt="" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              </div>

              {/* Dynamic Photographer Horizontal Swipe Slider Component */}
              {photographerPhotos.length > 1 && (
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mb-2 px-1">
                    More from {selectedPhoto.author_credit} ({photographerPhotos.length})
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 px-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {photographerPhotos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        onClick={() => setSelectedPhoto(photo)}
                        className={`flex-none w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border ${
                          selectedPhoto.id === photo.id 
                            ? 'border-amber-400 scale-95 ring-2 ring-amber-400/20' 
                            : 'border-white/10 opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={photo.image_url} alt="" className="w-full h-full object-cover pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Box Sidebar Workspace: Action Panels */}
            <div className="w-full md:w-80 flex flex-col text-white max-w-md bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md shrink-0">
              <div className="border-b border-white/10 pb-4 mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Context Frame
                </span>
                <p className="text-sm font-light mt-2 text-neutral-200 leading-relaxed max-h-[12vh] overflow-y-auto">
                  {selectedPhoto.caption}
                </p>
              </div>

              <div className="mb-6 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-neutral-400">Captured By</span>
                  <p className="text-lg font-bold text-white tracking-tight mt-0.5">{selectedPhoto.author_credit}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleLike(selectedPhoto.id)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                    <Heart className={`w-4 h-4 ${likedPhotos.includes(selectedPhoto.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button onClick={() => sharePhoto(selectedPhoto)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => downloadWithCredit(selectedPhoto.image_url, selectedPhoto.author_credit)}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold text-sm py-3.5 rounded-xl hover:bg-neutral-200 transition-all shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  Download with Credit
                </button>

                {/* Bulk Bundle Downloader Action */}
                <button
                  onClick={() => downloadEntireArchive(selectedPhoto.author_credit)}
                  disabled={isZipping || photographerPhotos.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white font-mono text-xs py-3 rounded-xl hover:bg-white/10 transition-all disabled:opacity-20"
                >
                  {isZipping ? 'Compiling ZIP...' : `Download Archive (.ZIP)`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
