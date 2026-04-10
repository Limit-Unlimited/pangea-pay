export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#1E4D8C] flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-2xl font-bold text-[#1A2332]" style={{ fontFamily: "var(--font-lato)" }}>
            Pangea Pay
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}
