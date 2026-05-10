import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#00C805] flex items-center justify-center shadow-[0_0_16px_rgba(0,200,5,0.4)]">
          <span className="text-sm font-black text-black">H</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Hood Options</span>
      </div>
      <SignIn />
    </main>
  );
}
