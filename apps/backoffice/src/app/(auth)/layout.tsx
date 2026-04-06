export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E4D8C] mb-4">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A2332]" style={{ fontFamily: "Lato, sans-serif" }}>
            Pangea Pay
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Operations Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
