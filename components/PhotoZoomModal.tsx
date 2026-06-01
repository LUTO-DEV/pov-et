'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';

interface Photo {
    id: string;
    image_url: string;
    caption: string;
    author_credit: string;
}

interface PhotoZoomModalProps {
    currentPhoto: Photo;
    onClose: () => void;
}

export default function PhotoZoomModal({ currentPhoto, onClose }: PhotoZoomModalProps) {
    const [photographerPhotos, setPhotographerPhotos] = useState<Photo[]>([]);
    const [activePhoto, setActivePhoto] = useState<Photo>(currentPhoto);
    const [isZipping, setIsZipping] = useState(false);

    // 1. Fetch all matching frames by this specific photographer from Supabase
    useEffect(() => {
        async function fetchPhotographerArchive() {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('author_credit', currentPhoto.author_credit)
                .eq('status', 'approved');

            if (!error && data) {
                setPhotographerPhotos(data);
            }
        }
        fetchPhotographerArchive();
        // Reset active photo if the base photo changes
        setActivePhoto(currentPhoto);
    }, [currentPhoto.author_credit, currentPhoto]);

    // 2. ZIP Archive Compilation Engine
    const downloadEntireArchive = async () => {
        setIsZipping(true);
        const zip = new JSZip();
        const folderName = `${activePhoto.author_credit.replace('@', '')}_pov_et_archive`;
        const imgFolder = zip.folder(folderName);

        try {
            const downloadPromises = photographerPhotos.map(async (photo, index) => {
                try {
                    const response = await fetch(photo.image_url);
                    if (!response.ok) throw new Error('Network response failure');
                    const blob = await response.blob();

                    // Retain strict ownership credit in the file naming convention
                    const fileName = `frame_${index + 1}_by_${photo.author_credit.replace('@', '')}.jpg`;
                    imgFolder?.file(fileName, blob);
                } catch (err) {
                    console.error(`Failed to fetch image for zip packaging: ${photo.image_url}`, err);
                }
            });

            await Promise.all(downloadPromises);

            const content = await zip.generateAsync({ type: 'blob' });

            // Client-side execution download payload trigger
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${folderName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Archive bundling failed:", err);
        } finally {
            setIsZipping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in">

            {/* HEADER SECTION */}
            <div className="w-full max-w-6xl flex justify-between items-center py-2">
                <div className="text-left">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Currently Viewing</span>
                    <p className="text-zinc-400 text-sm font-mono font-bold">shot by {activePhoto.author_credit}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-white text-xs font-mono tracking-widest uppercase border border-zinc-800 px-4 py-2 rounded-sm hover:bg-white hover:text-black transition-all duration-300"
                >
                    [ close ]
                </button>
            </div>

            {/* MAIN DISPLAY FRAME CONTEXT */}
            <div className="flex-1 flex items-center justify-center max-w-4xl w-full my-4">
                <div className="relative group flex flex-col items-center">
                    <img
                        src={activePhoto.image_url}
                        alt={activePhoto.caption}
                        className="max-h-[55vh] md:max-h-[60vh] object-contain rounded-xs shadow-2xl transition-all duration-500"
                    />
                    <div className="mt-4 text-center max-w-xl">
                        <p className="text-white text-base md:text-lg font-light tracking-wide">{activePhoto.caption}</p>
                    </div>
                </div>
            </div>

            {/* PHOTOGRAPHER CAROUSEL STREAM SLIDER */}
            <div className="w-full max-w-5xl border-t border-zinc-900 pt-4 bg-black/40 backdrop-blur-xs px-4 rounded-md pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <span className="text-[10px] md:text-xs font-mono text-amber-500/80 uppercase tracking-widest block">
                            Collection Database
                        </span>
                        <h3 className="text-white text-xs md:text-sm font-mono mt-0.5">
                            More frames from {activePhoto.author_credit} ({photographerPhotos.length})
                        </h3>
                    </div>

                    {/* Download Entire Collection Feature */}
                    <button
                        onClick={downloadEntireArchive}
                        disabled={isZipping || photographerPhotos.length === 0}
                        className="text-[11px] font-mono text-amber-400 border border-amber-400/20 px-4 py-2 rounded-xs hover:bg-amber-400 hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-amber-400 transition-all duration-300 tracking-wider uppercase font-bold self-start sm:self-center"
                    >
                        {isZipping ? '⚡ COMPILING ZIP...' : '📥 DOWNLOAD ALL (.ZIP)'}
                    </button>
                </div>

                {/* Swipeable Scroll Track Container */}
                <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent px-1">
                    {photographerPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            onClick={() => setActivePhoto(photo)}
                            className={`flex-none w-24 h-24 md:w-28 md:h-28 cursor-pointer relative overflow-hidden rounded-xs transition-all duration-300 border ${activePhoto.id === photo.id
                                    ? 'border-amber-400 scale-95 ring-2 ring-amber-400/20'
                                    : 'border-zinc-900 opacity-40 hover:opacity-100 hover:scale-102'
                                }`}
                        >
                            <img
                                src={photo.image_url}
                                alt=""
                                className="w-full h-full object-cover pointer-events-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}