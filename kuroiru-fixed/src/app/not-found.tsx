import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted">We couldn&apos;t find that page.</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black">
          Back home
        </Link>
      </div>
    </div>
  );
}
