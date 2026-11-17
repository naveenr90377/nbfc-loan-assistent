import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">

        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-900">
          <Briefcase className="w-6 h-6" />
          FinEase Capital
        </Link>

        <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
          <Link to="/" className="text-slate-600 hover:text-blue-900">
            Home
          </Link>

          <a href="/#loans" className="text-slate-600 hover:text-blue-900">
            Loans
          </a>

          <a href="/#how-it-works" className="text-slate-600 hover:text-blue-900 hidden sm:block">
            How it Works
          </a>

          <Link
            to="/chat"
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
          >
            Check Eligibility
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;