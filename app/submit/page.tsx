export default function SubmitPage() {
    return (
        <main className="min-h-screen bg-pov-cloud flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white/60 backdrop-blur-2xl rounded-3xl p-10 border border-white shadow-2xl text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Share your POV</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    We archive everyday Ethiopian life. No filters, just reality.
                </p>

                <div className="space-y-6 text-left">
                    <div className="p-4 bg-white/40 rounded-xl">
                        <span className="font-bold text-lg">1.</span> Open Telegram.
                    </div>
                    <div className="p-4 bg-white/40 rounded-xl">
                        <span className="font-bold text-lg">2.</span> Send your photo to <span className="font-semibold text-blue-500">@pov_et_archive</span>.
                    </div>
                    <div className="p-4 bg-white/40 rounded-xl">
                        <span className="font-bold text-lg">3.</span> Include your name/handle in the caption for credit.
                    </div>
                </div>

                <a href="/" className="mt-10 inline-block text-sm text-gray-500 hover:text-black transition">
                    ← Back to gallery
                </a>
            </div>
        </main>
    );
}