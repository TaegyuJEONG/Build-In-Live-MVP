export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">404: NODE_NOT_FOUND</h1>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">The requested sector is currently offline</p>
        <a href="/" className="inline-block mt-8 text-[10px] text-[#F95A56] hover:underline uppercase tracking-widest">RETURN_TO_HUB</a>
      </div>
    </div>
  )
}
