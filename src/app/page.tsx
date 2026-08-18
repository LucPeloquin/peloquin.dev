import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl mx-auto text-center">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-4">Jean-Luc Peloquin</h1>
          <h2 className="text-2xl text-gray-700 mb-6">Data Scientist & Software Developer</h2>
          
          <p className="text-lg mb-8">
            Welcome to my personal website. I&apos;m a passionate data scientist and software developer
            with expertise in machine learning, data analysis, and web development.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/portfolio" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition">
              View My Work
            </Link>
            <Link href="/about" className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-md font-medium transition">
              Learn More About Me
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
