import React, { useState, useEffect } from 'react';
import { StoreProvider } from './services/store';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { YasConciergeWidget } from './components/YasConciergeWidget';
import { HomePage } from './pages/HomePage';
import { RacesPage } from './pages/RacesPage';
import { RaceDetailPage } from './pages/RaceDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPanel } from './pages/AdminPanel';
import { HelpPage } from './pages/HelpPage';
import { TicketVerificationPage } from './pages/TicketVerificationPage';
import { PrintableTicketPage } from './pages/PrintableTicketPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [lastConfirmedOrderId, setLastConfirmedOrderId] = useState<string>('ord-89412');

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    // If it has hash, handle anchor or update path
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      if (basePath && basePath !== currentPath) {
        window.history.pushState({}, '', path);
        setCurrentPath(basePath);
      }
      setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching logic
  const renderCurrentRoute = () => {
    // Exact or slug patterns
    if (currentPath === '/' || currentPath === '') {
      return <HomePage navigate={navigate} />;
    }

    if (currentPath === '/races' || currentPath.startsWith('/races?')) {
      const searchParams = new URLSearchParams(window.location.search);
      const search = searchParams.get('search') || '';
      return <RacesPage navigate={navigate} initialSearch={search} />;
    }

    if (currentPath.startsWith('/races/')) {
      const slug = currentPath.replace('/races/', '').split('?')[0];
      return <RaceDetailPage slug={slug} navigate={navigate} />;
    }

    if (currentPath === '/cart') {
      return <CartPage navigate={navigate} />;
    }

    if (currentPath === '/checkout') {
      return (
        <CheckoutPage
          navigate={navigate}
          onOrderCompleted={(orderId) => setLastConfirmedOrderId(orderId)}
        />
      );
    }

    if (currentPath.startsWith('/order-confirmed')) {
      const parts = currentPath.split('/');
      const orderId = parts[2] || lastConfirmedOrderId;
      return <OrderConfirmationPage orderId={orderId} navigate={navigate} />;
    }

    // Public Ticket Enquiry & Verification Routes
    if (currentPath === '/ticket-enquiry' || currentPath === '/verify-ticket') {
      return <TicketVerificationPage navigate={navigate} />;
    }

    if (currentPath.startsWith('/verify-ticket/')) {
      const ticketNum = currentPath.replace('/verify-ticket/', '').split('?')[0];
      return <TicketVerificationPage initialTicketNumber={ticketNum} navigate={navigate} />;
    }

    // Printable Pass Voucher Routes
    if (currentPath.startsWith('/tickets/print/')) {
      const ticketNum = currentPath.replace('/tickets/print/', '').split('?')[0];
      return <PrintableTicketPage ticketNumber={ticketNum} navigate={navigate} />;
    }

    if (currentPath.startsWith('/orders/') && currentPath.endsWith('/tickets')) {
      const parts = currentPath.split('/');
      const orderId = parts[2];
      return <PrintableTicketPage orderId={orderId} navigate={navigate} />;
    }

    if (currentPath.startsWith('/account')) {
      return <AccountPage navigate={navigate} />;
    }

    // Admin Panel routes (/admin, /admin-panel, /admin-panel/bookings, /admin-panel/tickets, etc.)
    if (currentPath === '/admin' || currentPath.startsWith('/admin') || currentPath.startsWith('/admin-panel')) {
      let initialTab: 'dashboard' | 'events' | 'tickets' | 'categories' | 'orders' | 'emails' | 'discounts' | 'audit' | 'ledger' | 'qa_runner' = 'dashboard';
      let initialOrderId: string | undefined = undefined;

      if (currentPath.includes('/bookings') || currentPath.includes('/orders')) {
        initialTab = 'orders';
        const parts = currentPath.split('/');
        if (parts.length >= 4 && parts[3]) {
          initialOrderId = parts[3];
        }
      } else if (currentPath.includes('/tickets')) {
        initialTab = 'tickets';
      }

      return (
        <AdminPanel
          navigate={navigate}
          initialTab={initialTab}
          initialOrderId={initialOrderId}
        />
      );
    }

    if (currentPath === '/help') {
      return <HelpPage navigate={navigate} />;
    }

    // Default fallback to HomePage
    return <HomePage navigate={navigate} />;
  };

  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin') || currentPath.startsWith('/admin-panel');
  const isPrintRoute = currentPath.includes('/print') || (currentPath.startsWith('/orders/') && currentPath.endsWith('/tickets'));

  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#111827] selection:bg-[#123B67] selection:text-white">
        {/* Render Site Header only when not inside admin panel or print view */}
        {!isAdminRoute && !isPrintRoute && (
          <Header
            currentPath={currentPath}
            navigate={navigate}
            onOpenSearch={() => navigate('/races')}
          />
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1">
          {renderCurrentRoute()}
        </main>

        {/* Floating Yas Concierge Widget */}
        {!isAdminRoute && !isPrintRoute && (
          <YasConciergeWidget navigate={navigate} />
        )}

        {/* Site Footer */}
        {!isAdminRoute && !isPrintRoute && (
          <Footer navigate={navigate} />
        )}
      </div>
    </StoreProvider>
  );
}
