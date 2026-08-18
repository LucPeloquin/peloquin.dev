'use client';

import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <span className="text-white text-lg font-bold cursor-pointer">Jean-Luc Peloquin</span>
        </Link>
        <div className="space-x-4">
          <Link href="/">
            <span className="text-white hover:text-gray-300 cursor-pointer">Home</span>
          </Link>
          <Link href="/about">
            <span className="text-white hover:text-gray-300 cursor-pointer">About</span>
          </Link>
          <Link href="/portfolio">
            <span className="text-white hover:text-gray-300 cursor-pointer">Portfolio</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;