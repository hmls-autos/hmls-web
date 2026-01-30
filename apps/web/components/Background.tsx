export default function Background() {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-500" />
    </div>
  );
}
