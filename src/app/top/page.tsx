import Image from 'next/image';

export default function HomePage() {
  return (
    <div
      className="relative flex min-h-screen w-full items-end justify-center bg-cover bg-center p-8"
      style={{
        backgroundImage: 'url("image/home.jpg")',
      }}
    >
      <button className="rounded-full bg-red-500 px-12 py-4 text-3xl font-bold text-white shadow-lg transition-colors hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300">
        スタート
      </button>
    </div>
  );
}