import Link from "next/link";

export default function ParticipantNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[40px] font-bold tracking-tight">Profile not found.</h1>
      <p className="mt-3 text-[16px] text-muted">This public page is unpublished or does not exist.</p>
      <Link href="/" className="mt-8 text-[14px] font-medium underline underline-offset-4">
        Back home
      </Link>
    </div>
  );
}
