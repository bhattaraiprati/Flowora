
export default function Logo() {
  return (
    <div className="flex bg-brand rounded-lg items-center gap-3">
      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
      </div> 
      <div>
        <div className="text-white text-[20px] font-[600] pr-5 tracking-tight">Flowora</div>
      </div>
    </div>
  );
}