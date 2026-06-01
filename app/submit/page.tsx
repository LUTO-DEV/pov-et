'use client';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Smartphone } from 'lucide-react';

export default function SubmitPage() {
    return (
        <main className="relative min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between overflow-x-hidden">

            {/* Immersive Blurry Accent */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30 blur-[150px]">
                <div className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-orange-500" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-8 w-full flex-1 flex flex-col justify-between">

                {/* Navigation Head */}
                <header className="mb-12">
                    <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Archive
                    </a>
                </header>

                {/* Narrative Core Section */}
                <div className="my-auto max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-2.5 text-amber-400 font-bold tracking-widest text-xs uppercase mb-4"
                    >
                        <Smartphone className="w-4 h-4" /> Phone Shots Only
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-black tracking-tight mb-6 leading-tight"
                    >
                        Documenting the streets, <br />one frame at a time.
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4 text-neutral-300 font-light text-base sm:text-lg leading-relaxed"
                    >
                        <p>
                            I’ve been seeing a lot of cool phone pics lately, so I thought why not put them all in one place. I made a channel called <span className="text-white font-medium underline decoration-amber-400/50">pov.et</span> where people share aesthetic POV photos taken only on phones from around the country.
                        </p>
                        <p className="text-neutral-400 text-sm sm:text-base">
                            A simple archive for everyday phone shots from across Ethiopia. Send yours in and get featured with full attribution.
                        </p>
                    </motion.div>

                    {/* Action Grid Calls to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10"
                    >
                        {/* Telegram Bot Redirect */}
                        <a
                            href="https://t.me/povetbot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-all shadow-xl group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-neutral-900 text-white rounded-xl">
                                    <Send className="w-5 h-5 fill-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight">Submit via Telegram</h3>
                                    <p className="text-xs text-neutral-500 font-medium">@povetbot</p>
                                </div>
                            </div>
                        </a>

                        {/* Instagram Link (Using clean custom inline SVG icon) */}
                        <a
                            href="https://instagram.com/pov_et1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-white/10 text-white rounded-xl flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight text-white">Follow the Feed</h3>
                                    <p className="text-xs text-neutral-400">@pov_et1</p>
                                </div>
                            </div>
                        </a>
                    </motion.div>
                </div>

                {/* Footer info line */}
                <footer className="mt-12 text-center text-[11px] text-neutral-600 uppercase tracking-widest font-medium">
                    You can join pov.et and drop your pics too 🙌
                </footer>
            </div>
        </main>
    );
}