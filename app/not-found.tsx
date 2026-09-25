import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="font-display text-7xl text-sun-400">U-TURN!</div>
      <p className="text-night-300 mt-3 mb-6">This road doesn&apos;t go anywhere. (And remember: no U-turns at traffic lights unless a sign permits it.)</p>
      <Link href="/" className="btn-3d bg-gradient-to-b from-sun-400 to-sun-600 text-night-950 px-6 py-3">Back home</Link>
    </div>
  );
}
