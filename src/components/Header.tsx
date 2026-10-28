import React, { useState } from 'react';
import { useStore } from '../services/store';
import { CurrencyCode, UserRole } from '../types';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  ShieldCheck,
  Ticket,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, navigate, onOpenSearch }) => {
  const { cart, currency, setCurrency, currentUser, setCurrentUser } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser({
      ...currentUser,
      role,
      displayName:
        role === 'admin'
          ? 'Alex Kovács (Admin)'
          : role === 'inventory_manager'
          ? 'Márton Szabó (Inventory)'
          : role === 'support_agent'
          ? 'Anna Nagy (Support)'
          : 'Adil Thengilan'
    });
    setAccountMenuOpen(false);
  };

  const navLinks = [
    { label: 'Grand Prix', path: '/races' },
    { label: 'Race Calendar', path: '/races/abu-dhabi-grand-prix-2026' },
    { label: 'Concerts', path: '/#concerts' },
    { label: 'Premium Experiences', path: '/#premium' },
    { label: 'Verify Pass', path: '/ticket-enquiry' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/races?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    } else {
      navigate('/races');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          
          {/* Left: Official Mastrotickets Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-left cursor-pointer focus:outline-none shrink-0 py-1 hover:opacity-90 transition-opacity"
            title="Mastrotickets - Home"
          >
            <img
              src="/assets/aistudio/mastro-logo_504ab54e.png"
              alt="Mastro Tickets"
              className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[240px] object-contain"
            />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-medium text-[#111827]">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.path.startsWith('/#')) {
                    if (currentPath !== '/') {
                      navigate('/');
                      setTimeout(() => {
                        const el = document.getElementById(link.path.replace('/#', ''));
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      const el = document.getElementById(link.path.replace('/#', ''));
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    navigate(link.path);
                  }
                }}
                className={`py-1 hover:text-[#123B67] transition-colors whitespace-nowrap cursor-pointer ${
                  currentPath === link.path
                    ? 'text-[#0B1F3A] font-bold border-b-2 border-[#0B1F3A]'
                    : 'text-[#475569]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Utilities: Search, Currency, Cart, Account */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            
            {/* Inline Quick Search on Desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search Grand Prix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 xl:w-52 pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-full text-xs text-[#111827] placeholder-[#64748B] focus:border-[#0B1F3A] focus:outline-none focus:bg-white transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </form>

            {/* Search Icon button on Mobile */}
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else navigate('/races');
              }}
              className="md:hidden p-2 text-[#475569] hover:text-[#0B1F3A] hover:bg-[#F5F7FA] rounded-full transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Currency Selector (AED / USD / EUR) */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-white text-xs font-semibold text-[#111827] border border-[#E2E8F0] rounded-full px-2.5 py-1.5 focus:border-[#0B1F3A] focus:outline-none cursor-pointer shadow-xs"
              title="Select Currency"
            >
              <option value="AED">AED</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>

            {/* Shopping Cart Icon with Navy Badge */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-[#111827] hover:bg-[#F5F7FA] rounded-full transition-colors cursor-pointer border border-[#E2E8F0]"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#0B1F3A]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#123B67] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Account / Sign In Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-full bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#111827] transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white text-[11px] font-bold">
                  {currentUser.displayName.charAt(0)}
                </div>
                <span className="hidden sm:inline font-medium text-xs max-w-[90px] truncate text-[#0B1F3A]">
                  {currentUser.displayName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {accountMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50 text-xs text-[#111827]"
                  onMouseLeave={() => setAccountMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#E2E8F0]">
                    <p className="text-[#0B1F3A] font-bold truncate">{currentUser.displayName}</p>
                    <p className="text-[#64748B] text-[11px] truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#15803D] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Role: {currentUser.role.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/account');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[#111827] hover:bg-[#F5F7FA] transition-colors flex items-center gap-2 font-medium"
                    >
                      <Ticket className="w-3.5 h-3.5 text-[#123B67]" />
                      <span>My Orders & E-Tickets</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/ticket-enquiry');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[#111827] hover:bg-[#F5F7FA] transition-colors flex items-center gap-2 font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Verify Pass Authenticity</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/admin');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[#123B67] hover:bg-[#F5F7FA] font-semibold transition-colors flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#123B67]" />
                      <span>Admin Operations Portal</span>
                    </button>
                  </div>

                  <div className="px-4 py-2 border-t border-[#E2E8F0] bg-[#F5F7FA]">
                    <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                      Role Switcher
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {(['customer', 'admin', 'inventory_manager', 'support_agent'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={`px-2 py-1 rounded text-left truncate transition-colors ${
                            currentUser.role === r
                              ? 'bg-[#123B67] text-white font-semibold'
                              : 'text-[#475569] hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {r === 'admin'
                            ? 'Admin'
                            : r === 'customer'
                            ? 'Customer'
                            : r === 'inventory_manager'
                            ? 'Inventory'
                            : 'Support'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#111827] hover:bg-[#F5F7FA] rounded border border-[#E2E8F0]"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="mb-3 relative">
            <input
              type="text"
              placeholder="Search Grand Prix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] placeholder-[#64748B] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="flex flex-col gap-1 text-xs font-medium">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (link.path.startsWith('/#')) {
                    navigate('/');
                    setTimeout(() => {
                      const el = document.getElementById(link.path.replace('/#', ''));
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    navigate(link.path);
                  }
                }}
                className="flex items-center gap-3 text-left py-2.5 px-3 rounded text-[#111827] hover:bg-[#F5F7FA] font-medium"
              >
                <span>{link.label}</span>
              </button>
            ))}

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-1">
              <button
                onClick={() => {
                  navigate('/account');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 py-2.5 px-3 rounded text-[#111827] hover:bg-[#F5F7FA]"
              >
                <Ticket className="w-4 h-4 text-[#123B67]" />
                <span>My Bookings & E-Tickets</span>
              </button>
              <button
                onClick={() => {
                  navigate('/admin-panel/home');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 py-2.5 px-3 rounded text-[#123B67] bg-[#F5F7FA]"
              >
                <ShieldCheck className="w-4 h-4 text-[#123B67]" />
                <span className="font-semibold">Admin Panel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
