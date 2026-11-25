import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white/60 py-6 px-4 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-white/40 text-xs text-center sm:text-left">
          &copy; {new Date().getFullYear()} HausFindrr &mdash; Papua New Guinea&apos;s Rental Marketplace
        </p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/landlord-agreement" className="hover:text-white transition-colors">
            Landlord Agreement
          </Link>
          <a href="mailto:info@hausfindrr.com" className="hover:text-white transition-colors">
            Contact Us
          </a>
        </nav>
      </div>
    </footer>
  );
}
