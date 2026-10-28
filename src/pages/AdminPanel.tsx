import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { GrandPrixEvent, TicketType, EventCategory, Order, EmailJob, TicketCategory, RaceDayOption, IssuedTicket } from '../types';
import { runCompleteFunctionalAudit, FullAuditReport } from '../services/qaAuditRunner';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  ShoppingBag,
  Mail,
  Tag,
  History,
  ShieldCheck,
  Search,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Send,
  X,
  RotateCcw,
  Lock,
  LogOut,
  ExternalLink,
  Layers,
  Sparkles,
  FileText,
  Database,
  Play,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Printer
} from 'lucide-react';

interface AdminPanelProps {
  navigate: (path: string) => void;
  initialTab?: 'dashboard' | 'events' | 'tickets' | 'categories' | 'orders' | 'emails' | 'discounts' | 'audit' | 'ledger' | 'qa_runner' | 'system';
  initialOrderId?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ navigate, initialTab = 'dashboard', initialOrderId }) => {
  const {
    events,
    tickets,
    categories,
    orders,
    discounts,
    emailJobs,
    auditLogs,
    inventoryLedger,
    reservations,
    formatPrice,
    currentUser,
    updateEvent,
    createEvent,
    deleteEvent,
    updateTicket,
    createTicket,
    deleteTicket,
    voidTicket,
    reissueTicket,
    retryEmailJob,
    addCategory,
    updateCategory,
    deleteCategory,
    sendCustomEmail,
    refundOrder,
    resendConfirmationEmail,
    createDiscountCode,
    toggleDiscountActive
  } = useStore();

  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mastrotickets_admin_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername.trim() === 'mastrotickets' && loginPassword === 'mastrotickets@123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('mastrotickets_admin_auth', 'true');
      setLoginError(null);
      showToast('Welcome, Administrator! Authenticated successfully.');
    } else {
      setLoginError('Invalid administrator credentials. Please check your username and password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('mastrotickets_admin_auth');
    showToast('Signed out of Admin Panel.');
  };

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'events' | 'tickets' | 'categories' | 'orders' | 'emails' | 'discounts' | 'audit' | 'ledger' | 'qa_runner' | 'system'
  >(initialTab);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dashboard Aggregates
  const totalGrossSales = orders.reduce(
    (acc, o) => (o.status !== 'refunded' ? acc + o.total : acc),
    0
  );
  const totalOrdersCount = orders.length;
  const ticketsSoldCount = orders
    .filter((o) => o.status !== 'refunded')
    .reduce((acc, o) => acc + o.tickets.length, 0);
  const totalInventoryRemaining = tickets.reduce((acc, t) => acc + t.availableQuantity, 0);

  // Modals state
  const [editingEvent, setEditingEvent] = useState<GrandPrixEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<GrandPrixEvent | null>(null);

  // Sync initialOrderId if provided
  useEffect(() => {
    if (initialOrderId) {
      const match = orders.find((o) => o.id === initialOrderId || o.orderNumber === initialOrderId);
      if (match) {
        setSelectedOrderDetails(match);
        setActiveTab('orders');
      }
    }
  }, [initialOrderId, orders]);

  // Filter & Search states
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketEventFilter, setTicketEventFilter] = useState('all');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('all');
  const [ticketSubTab, setTicketSubTab] = useState<'catalog' | 'issued_passes'>('catalog');

  const [eventSearch, setEventSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // QA Audit runner state
  const [qaAuditReport, setQaAuditReport] = useState<FullAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    const report = await runCompleteFunctionalAudit();
    setQaAuditReport(report);
    setIsRunningAudit(false);
    showToast(`Audit completed: ${report.passedCount}/${report.totalTests} tests passed in ${report.durationMs}ms.`);
  };

  // New Event Form State
  const [eventForm, setEventForm] = useState({
    name: '',
    officialTitle: '',
    circuit: '',
    location: '',
    country: '',
    countryCode: 'AE',
    flag: '🇦🇪',
    dates: 'Dec 04 - Dec 06, 2026',
    startDate: '2026-12-04',
    endDate: '2026-12-06',
    round: 24,
    season: 2026,
    timezone: 'Asia/Dubai',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    description: 'Official Formula 1 Grand Prix weekend featuring covered grandstands and after-race concerts.',
    status: 'published' as const,
    startingPrice: 350,
    featured: true,
    lapDistance: '5.281 km',
    numberOfLaps: 58,
    raceDistance: '306.183 km',
    lapRecord: {
      time: '1:26.103',
      driver: 'Max Verstappen',
      year: 2021
    },
    schedule: [
      {
        day: 'Friday',
        date: 'Dec 04, 2026',
        sessions: [
          { name: 'Practice 1', time: '13:30 - 14:30', type: 'practice' as const },
          { name: 'Practice 2', time: '17:00 - 18:00', type: 'practice' as const }
        ]
      },
      {
        day: 'Saturday',
        date: 'Dec 05, 2026',
        sessions: [
          { name: 'Practice 3', time: '14:30 - 15:30', type: 'practice' as const },
          { name: 'Qualifying', time: '18:00 - 19:00', type: 'qualifying' as const }
        ]
      },
      {
        day: 'Sunday',
        date: 'Dec 06, 2026',
        sessions: [
          { name: 'Grand Prix (58 Laps)', time: '17:00', type: 'race' as const }
        ]
      }
    ]
  });

  // New Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    name: '',
    eventId: events[0]?.id || '',
    category: 'grandstand' as TicketCategory,
    raceDay: '3-Day Package' as RaceDayOption,
    section: 'Main Grandstand Covered',
    description: 'Premium shaded grandstand with panoramic views of the main straight, pit lane, and podium ceremony.',
    price: 490,
    fee: 25,
    capacity: 250,
    availableQuantity: 250,
    features: 'Covered Seating, Big Screen View, Etihad Park Concert Access, Theme Park Access',
    isAssignedSeating: true,
    deliveryType: 'instant_eticket' as const,
    status: 'available' as const,
    maxPerOrder: 8,
    imageUrl: ''
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    badgeColor: '#0B1F3A'
  });

  // Email Writing Form State
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    recipientName: '',
    template: 'custom_announcement' as EmailJob['template'],
    subject: '',
    bodyText: ''
  });

  // Discount Code Form State
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    code: '',
    discountPercent: 10,
    discountAmount: 0,
    minSpend: 200,
    maxUsage: 100,
    validUntil: '2026-12-31',
    active: true
  });

  // Handle Save Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateEvent(editingEvent);
      setEditingEvent(null);
      showToast(`Event "${editingEvent.name}" updated successfully.`);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name.trim()) return;
    createEvent(eventForm);
    setIsAddingEvent(false);
    showToast(`Event "${eventForm.name}" created successfully.`);
    // Reset form
    setEventForm({
      ...eventForm,
      name: '',
      circuit: '',
      location: '',
      country: ''
    });
  };

  const handleDeleteEvent = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete event "${name}"? All associated tickets will also be deleted.`)) {
      deleteEvent(id);
      showToast(`Event "${name}" deleted.`);
    }
  };

  // Handle Save Ticket
  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicket) {
      updateTicket(editingTicket);
      setEditingTicket(null);
      showToast(`Ticket "${editingTicket.name}" updated successfully.`);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.name.trim()) return;
    const featuresArray = ticketForm.features
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    createTicket({
      ...ticketForm,
      features: featuresArray
    });
    setIsAddingTicket(false);
    showToast(`Ticket "${ticketForm.name}" created successfully.`);
    setTicketForm({
      ...ticketForm,
      name: '',
      section: '',
      price: 350
    });
  };

  const handleDeleteTicket = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ticket "${name}"?`)) {
      deleteTicket(id);
      showToast(`Ticket "${name}" deleted.`);
    }
  };

  // Handle Category Actions
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addCategory({
      name: categoryForm.name,
      slug,
      description: categoryForm.description,
      badgeColor: categoryForm.badgeColor
    });
    setIsAddingCategory(false);
    showToast(`Category "${categoryForm.name}" added.`);
    setCategoryForm({ name: '', slug: '', description: '', badgeColor: '#0B1F3A' });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory);
      setEditingCategory(null);
      showToast(`Category "${editingCategory.name}" updated.`);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      deleteCategory(id);
      showToast(`Category "${name}" deleted.`);
    }
  };

  // Handle Email Sending
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.recipientEmail.trim() || !emailForm.subject.trim()) return;
    const res = sendCustomEmail({
      recipientEmail: emailForm.recipientEmail,
      recipientName: emailForm.recipientName || 'Valued Guest',
      subject: emailForm.subject,
      bodyText: emailForm.bodyText,
      template: emailForm.template
    });
    setIsComposingEmail(false);
    showToast(res.message);
    setEmailForm({
      recipientEmail: '',
      recipientName: '',
      template: 'custom_announcement',
      subject: '',
      bodyText: ''
    });
  };

  // Handle Discount Create
  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.code.trim()) return;
    createDiscountCode({
      code: discountForm.code.toUpperCase().trim(),
      discountPercent: discountForm.discountPercent || undefined,
      discountAmount: discountForm.discountAmount || undefined,
      minSpend: discountForm.minSpend,
      maxUsage: discountForm.maxUsage,
      validUntil: discountForm.validUntil,
      active: discountForm.active
    });
    setIsAddingDiscount(false);
    showToast(`Discount code ${discountForm.code.toUpperCase()} created.`);
    setDiscountForm({
      code: '',
      discountPercent: 10,
      discountAmount: 0,
      minSpend: 200,
      maxUsage: 100,
      validUntil: '2026-12-31',
      active: true
    });
  };

  // Handle Refund
  const handleTriggerRefund = (orderId: string) => {
    const reason = prompt('Please enter refund reason for audit records:', 'Customer requested cancellation per promoter policy');
    if (reason) {
      const res = refundOrder(orderId, reason);
      showToast(res.message);
    }
  };

  // Handle Email Resend
  const handleResendEmail = (orderId: string) => {
    const res = resendConfirmationEmail(orderId);
    showToast(res.message);
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketEventFilter !== 'all' && t.eventId !== ticketEventFilter) return false;
    if (ticketCategoryFilter !== 'all' && t.category !== ticketCategoryFilter) return false;
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q) ||
        t.raceDay.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (!eventSearch.trim()) return true;
    const q = eventSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.circuit.toLowerCase().includes(q) ||
      e.country.toLowerCase().includes(q)
    );
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'confirmed' && o.status !== 'confirmed') return false;
      if (orderStatusFilter === 'refunded' && o.status !== 'refunded') return false;
      if (orderStatusFilter === 'pending_payment' && o.status !== 'pending_payment') return false;
      if (orderStatusFilter === 'issuance_pending' && o.tickets.length > 0) return false;
      if (orderStatusFilter === 'email_failed') {
        const hasFailedEmail = emailJobs.some((j) => j.orderId === o.id && j.status === 'failed');
        if (!hasFailedEmail) return false;
      }
      if (orderStatusFilter === 'expired' && o.status !== 'expired') return false;
    }
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  });

  // ==========================================
  // LOGIN SCREEN (If not authenticated)
  // ==========================================
  if (!isAdminAuthenticated) {
    return (
      <div className="bg-[#F5F7FA] min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#0B1F3A] p-6 text-white text-center border-b border-[#163A63]">
            <div className="bg-white px-3.5 py-1.5 rounded-lg inline-flex items-center mx-auto mb-3 shadow-md">
              <img
                src="/assets/aistudio/mastro-logo_504ab54e.png"
                alt="Mastro Tickets"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
              Admin & Operations Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-6 sm:p-8 space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[#64748B] font-bold uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                required
                placeholder="mastrotickets"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] font-medium focus:border-[#123B67] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#64748B] font-bold uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                placeholder="mastrotickets@123"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] font-medium focus:border-[#123B67] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] space-y-1">
              <div className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#123B67]" />
                <span>Default Credentials</span>
              </div>
              <div className="font-mono text-slate-700">Username: <strong className="text-[#0B1F3A]">mastrotickets</strong></div>
              <div className="font-mono text-slate-700">Password: <strong className="text-[#0B1F3A]">mastrotickets@123</strong></div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#123B67] hover:bg-[#1D5288] text-white font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md text-xs mt-2"
            >
              Sign In to Admin Panel
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-[#64748B] hover:text-[#0B1F3A] underline cursor-pointer"
              >
                Return to Customer Storefront
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED ADMIN PANEL
  // ==========================================
  return (
    <div className="bg-[#F5F7FA] min-h-screen text-[#111827] flex flex-col font-sans">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="cursor-pointer focus:outline-none flex items-center hover:opacity-90 transition-opacity"
            title="Go to Storefront"
          >
            <img
              src="/assets/aistudio/mastro-logo_504ab54e.png"
              alt="Mastro Tickets"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono text-[#15803D] font-bold">ADMIN OPERATIONS</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#F5F7FA] border border-[#E2E8F0] text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
            <span className="text-[#0B1F3A] font-medium">Stripe Live</span>
            <span>·</span>
            <span>Firestore Synced</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748B] hidden md:inline font-mono">mastrotickets</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#123B67] text-white uppercase">
              Administrator
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-[#123B67] hover:text-[#1D5288] flex items-center gap-1 cursor-pointer"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleAdminLogout}
            title="Log out from admin"
            className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-4 bg-white border border-[#15803D] rounded-lg text-xs text-[#15803D] shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Admin Workspace: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-[#E2E8F0] p-4 space-y-1 shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'events', label: 'Grand Prix Events', icon: Calendar, badge: events.length },
            { id: 'tickets', label: 'Tickets & Verification', icon: Ticket, badge: tickets.length },
            { id: 'ledger', label: 'Inventory Ledger', icon: Database, badge: inventoryLedger.length },
            { id: 'categories', label: 'Categories & Sectors', icon: Layers, badge: categories.length },
            { id: 'orders', label: 'Bookings & Orders', icon: ShoppingBag, badge: orders.length },
            { id: 'emails', label: 'Email Writing & Queue', icon: Mail, badge: emailJobs.length },
            { id: 'discounts', label: 'Promo & Discounts', icon: Tag, badge: discounts.length },
            { id: 'audit', label: 'Audit Security Log', icon: History, badge: auditLogs.length },
            { id: 'qa_runner', label: 'QA Lifecycle Audit', icon: Play },
            { id: 'system', label: 'System & API Health', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#123B67] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#0B1F3A]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F5F7FA] text-[#64748B] border border-[#E2E8F0]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#F5F7FA]">
          
          {/* ==========================================
              1. DASHBOARD
             ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl">
              <div>
                <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                  Executive Dashboard
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Live commerce metrics from Cloud Firestore and verified Stripe transactions.
                </p>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-[#64748B]">
                    <span>Gross Sales</span>
                    <DollarSign className="w-4 h-4 text-[#15803D]" />
                  </div>
                  <div className="text-2xl font-black text-[#0B1F3A] font-mono mt-2 tabular-nums">
                    {formatPrice(totalGrossSales)}
                  </div>
                  <div className="text-[11px] text-[#15803D] mt-1 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% live pace</span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-[#64748B]">
                    <span>Total Bookings</span>
                    <ShoppingBag className="w-4 h-4 text-[#123B67]" />
                  </div>
                  <div className="text-2xl font-black text-[#0B1F3A] font-mono mt-2 tabular-nums">
                    {totalOrdersCount}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Confirmed orders on file
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-[#64748B]">
                    <span>Tickets Issued</span>
                    <Ticket className="w-4 h-4 text-[#163A63]" />
                  </div>
                  <div className="text-2xl font-black text-[#0B1F3A] font-mono mt-2 tabular-nums">
                    {ticketsSoldCount}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Barcoded passes delivered
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-[#64748B]">
                    <span>Remaining Inventory</span>
                    <Users className="w-4 h-4 text-[#B45309]" />
                  </div>
                  <div className="text-2xl font-black text-[#0B1F3A] font-mono mt-2 tabular-nums">
                    {totalInventoryRemaining}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Available grandstand seats
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide">
                    Recent Customer Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#123B67] hover:underline font-semibold cursor-pointer"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="pb-2.5">Order #</th>
                        <th className="pb-2.5">Customer</th>
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Total</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-[#F5F7FA]">
                          <td className="py-3 font-mono font-bold text-[#0B1F3A]">{o.orderNumber}</td>
                          <td className="py-3 text-[#111827]">{o.customerName}</td>
                          <td className="py-3 text-[#64748B]">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 font-mono font-bold text-[#111827]">{formatPrice(o.total)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.status === 'confirmed' ? 'bg-[#15803D]/10 text-[#15803D]' : 'bg-red-50 text-red-600'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="px-2.5 py-1 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              2. EVENTS MANAGEMENT
             ========================================== */}
          {activeTab === 'events' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Grand Prix Events ({filteredEvents.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage calendar race listings, dates, circuits, starting prices, and banner visuals.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setIsAddingEvent(true)}
                    className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Events Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Round</th>
                      <th className="p-3.5">Event Name</th>
                      <th className="p-3.5">Circuit & Location</th>
                      <th className="p-3.5">Dates</th>
                      <th className="p-3.5">Starting Price</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5 font-mono font-bold text-[#163A63]">R{evt.round}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                            <span>{evt.flag}</span>
                            <span>{evt.name}</span>
                          </div>
                          {evt.featured && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-[#123B67]/10 text-[#123B67] rounded text-[10px] font-bold">
                              Featured Race
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#64748B]">
                          <div>{evt.circuit}</div>
                          <div className="text-[11px]">{evt.location}, {evt.country}</div>
                        </td>
                        <td className="p-3.5 text-[#111827]">{evt.dates}</td>
                        <td className="p-3.5 font-mono font-bold text-[#111827]">{formatPrice(evt.startingPrice)}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#15803D]/10 text-[#15803D]">
                            {evt.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedEventDetails(evt)}
                              title="Inspect Event"
                              className="p-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] rounded cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingEvent(evt)}
                              title="Edit Event"
                              className="p-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#123B67] rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id, evt.name)}
                              title="Delete Event"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              3. TICKETS & INVENTORY
             ========================================== */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Tickets & Inventory ({filteredTickets.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage covered grandstands, hill admission passes, VIP tiers, and real-time seat capacities.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingTicket(true)}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ticket</span>
                </button>
              </div>

              {/* Subtab Switcher */}
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                <button
                  onClick={() => setTicketSubTab('catalog')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    ticketSubTab === 'catalog'
                      ? 'bg-[#123B67] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F5F7FA]'
                  }`}
                >
                  Product Catalog & Stock ({filteredTickets.length})
                </button>
                <button
                  onClick={() => setTicketSubTab('issued_passes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    ticketSubTab === 'issued_passes'
                      ? 'bg-[#123B67] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F5F7FA]'
                  }`}
                >
                  Issued Passes Registry ({orders.reduce((acc, o) => acc + o.tickets.length, 0)})
                </button>
              </div>

              {ticketSubTab === 'catalog' ? (
                <>
                  {/* Filters toolbar */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ticket name, grandstand, day..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none"
                  />
                </div>

                <div className="w-48">
                  <select
                    value={ticketEventFilter}
                    onChange={(e) => setTicketEventFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Grand Prix Events</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-44">
                  <select
                    value={ticketCategoryFilter}
                    onChange={(e) => setTicketCategoryFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="grandstand">Covered Grandstand</option>
                    <option value="general_admission">General Admission</option>
                    <option value="weekend_bundle">Weekend 3-Day Bundle</option>
                    <option value="vip_hospitality">VIP Hospitality</option>
                    <option value="concert">Concert Access</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Ticket Name</th>
                      <th className="p-3.5">Category & Sector</th>
                      <th className="p-3.5">Race Day</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Inventory</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5">
                          <div className="font-bold text-[#0B1F3A]">{t.name}</div>
                          <div className="text-[11px] text-[#64748B]">{t.deliveryType}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] uppercase bg-[#123B67]/10 text-[#123B67] px-2 py-0.5 rounded font-bold">
                            {t.category}
                          </span>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{t.section}</div>
                        </td>
                        <td className="p-3.5 font-medium text-[#111827]">{t.raceDay}</td>
                        <td className="p-3.5 font-mono font-bold text-[#0B1F3A]">
                          {formatPrice(t.price)}
                          <span className="text-[10px] text-[#64748B] block font-normal">+ {formatPrice(t.fee)} fee</span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-[#111827]">
                            {t.availableQuantity} / {t.capacity}
                          </div>
                          <div className="w-24 h-1.5 bg-[#E2E8F0] rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-[#15803D]"
                              style={{ width: `${Math.min(100, (t.availableQuantity / t.capacity) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'available' ? 'bg-[#15803D]/10 text-[#15803D]' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingTicket(t)}
                              title="Edit Ticket"
                              className="p-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#123B67] rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t.id, t.name)}
                              title="Delete Ticket"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Issued Passes Registry */
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                    <th className="p-3.5">Ticket Reference</th>
                    <th className="p-3.5">Attendee</th>
                    <th className="p-3.5">Event & Grandstand</th>
                    <th className="p-3.5">Seat Allocation</th>
                    <th className="p-3.5">Order Ref</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Pass Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {orders.flatMap((o) =>
                    o.tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5 font-mono font-bold text-[#0B1F3A]">
                          {t.ticketNumber}
                          {t.voidReason && (
                            <div className="text-[10px] text-red-600 font-sans font-normal mt-0.5">
                              {t.voidReason}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-semibold text-[#111827]">
                          {t.attendeeName}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-[#0B1F3A] truncate max-w-xs">{t.eventName}</div>
                          <div className="text-[11px] text-[#64748B]">{t.category} · {t.raceDay}</div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-[#0B1F3A]">
                          Row {t.row || 'GA'}, Seat {t.seat || 'Open'}
                        </td>
                        <td className="p-3.5 font-mono text-[#123B67] text-[11px]">
                          {o.orderNumber}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'issued'
                              ? 'bg-[#15803D]/10 text-[#15803D]'
                              : t.status === 'void'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {t.status || 'issued'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/verify-ticket/${t.ticketNumber}`)}
                              title="Verify authenticity publicly"
                              className="px-2 py-1 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#123B67] rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => navigate(`/tickets/print/${t.ticketNumber}`)}
                              title="Print E-Ticket Voucher"
                              className="px-2 py-1 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                            {t.status === 'issued' && (
                              <>
                                <button
                                  onClick={() => {
                                    const reason = prompt(`Reason for voiding ticket ${t.ticketNumber}:`, 'Customer requested cancellation or refund');
                                    if (reason) {
                                      const res = voidTicket(t.ticketNumber, reason);
                                      showToast(res.message);
                                    }
                                  }}
                                  title="Void this ticket"
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-semibold cursor-pointer"
                                >
                                  Void
                                </button>
                                <button
                                  onClick={() => {
                                    const newName = prompt(`Enter new attendee name for reissued pass (leave blank to keep "${t.attendeeName}"):`, t.attendeeName);
                                    if (newName !== null) {
                                      const res = reissueTicket(t.ticketNumber, newName || t.attendeeName);
                                      showToast(res.message);
                                    }
                                  }}
                                  title="Reissue under new unique token"
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#123B67] rounded text-[11px] font-semibold cursor-pointer"
                                >
                                  Reissue
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

          {/* ==========================================
              4. CATEGORIES & SECTORS
             ========================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Ticket Categories & Grandstand Sectors ({categories.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage taxonomy for Covered Grandstands, General Admission Hill, VIP Hospitality, and Concerts.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const count = tickets.filter((t) => t.category === cat.slug).length;
                  return (
                    <div key={cat.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="px-2.5 py-1 rounded text-xs font-bold text-white font-mono uppercase"
                            style={{ backgroundColor: cat.badgeColor || '#0B1F3A' }}
                          >
                            {cat.slug}
                          </span>
                          <span className="text-xs text-[#64748B] font-mono">{count} ticket types</span>
                        </div>
                        <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase mt-2">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="px-3 py-1 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#123B67] rounded text-xs font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================
              5. ORDERS & PAYMENTS
             ========================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Customer Orders & Transactions ({filteredOrders.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Live Stripe authorizations, tax invoices, and automated 2D barcode pass delivery.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search order number or email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none w-64"
                  />
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Orders', count: orders.length },
                  { id: 'confirmed', label: 'Confirmed & Paid', count: orders.filter((o) => o.status === 'confirmed').length },
                  { id: 'refunded', label: 'Refunded', count: orders.filter((o) => o.status === 'refunded').length },
                  { id: 'pending_payment', label: 'Pending Payment', count: orders.filter((o) => o.status === 'pending_payment').length },
                  { id: 'email_failed', label: 'Email Issue', count: emailJobs.filter((j) => j.status === 'failed').length }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setOrderStatusFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      orderStatusFilter === chip.id
                        ? 'bg-[#123B67] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#0B1F3A]'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      orderStatusFilter === chip.id ? 'bg-white/20 text-white' : 'bg-[#F5F7FA] text-[#64748B]'
                    }`}>
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total & Payment</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-[#0B1F3A]">{o.orderNumber}</div>
                          <div className="text-[11px] text-[#64748B]">{new Date(o.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#111827]">{o.customerName}</div>
                          <div className="text-[11px] text-[#64748B] font-mono">{o.customerEmail}</div>
                          <div className="text-[10px] text-[#94A3B8]">{o.customerPhone}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-[#111827] font-medium">{o.items.length} item(s)</div>
                          <div className="text-[11px] text-[#64748B] truncate max-w-xs">
                            {o.items.map((i) => i.ticketName).join(', ')}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-[#0B1F3A]">{formatPrice(o.total)}</div>
                          <div className="text-[10px] text-[#64748B] font-sans capitalize">{o.paymentMethod || 'Credit Card'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.status === 'confirmed' ? 'bg-[#15803D]/10 text-[#15803D]' : 'bg-red-50 text-red-600'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="px-2.5 py-1 bg-[#123B67] hover:bg-[#1D5288] text-white rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleResendEmail(o.id)}
                              title="Resend confirmation email"
                              className="px-2.5 py-1 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Email
                            </button>
                            {o.status !== 'refunded' && (
                              <button
                                onClick={() => handleTriggerRefund(o.id)}
                                title="Process refund via Stripe"
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              6. EMAIL WRITING & LOGS
             ========================================== */}
          {activeTab === 'emails' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Email Writing & Resend Dispatch Logs ({emailJobs.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Compose official announcements, event schedule notifications, and verify delivered transactional emails.
                  </p>
                </div>

                <button
                  onClick={() => setIsComposingEmail(true)}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose Email</span>
                </button>
              </div>

              {/* Email Jobs Log */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Template</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Sent At</th>
                      <th className="p-3.5 text-right">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {emailJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5">
                          <div className="font-bold text-[#0B1F3A]">{job.recipientName}</div>
                          <div className="font-mono text-[#64748B] text-[11px]">{job.recipientEmail}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] uppercase bg-[#123B67]/10 text-[#123B67] px-2 py-0.5 rounded font-bold">
                            {job.template}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#111827] max-w-sm">
                          <div className="font-semibold truncate">{job.subject}</div>
                          {job.bodyText && (
                            <div className="text-[11px] text-[#64748B] truncate mt-0.5">{job.bodyText}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-[#64748B] font-mono text-[11px]">
                          {new Date(job.sentAt).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              job.status === 'delivered' ? 'bg-[#15803D]/10 text-[#15803D]' : 'bg-red-50 text-red-600'
                            }`}>
                              {job.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              <span>{job.status}</span>
                            </span>
                            <button
                              onClick={() => {
                                const res = retryEmailJob(job.id);
                                showToast(res.message);
                              }}
                              className="px-2 py-0.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#123B67] rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              7. DISCOUNTS & PROMO CODES
             ========================================== */}
          {activeTab === 'discounts' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Promotional Discounts ({discounts.length})
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage promo codes, coupon percentages, expiration dates, and usage limits.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingDiscount(true)}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Discount</span>
                </button>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Promo Code</th>
                      <th className="p-3.5">Benefit</th>
                      <th className="p-3.5">Min Spend</th>
                      <th className="p-3.5">Usage</th>
                      <th className="p-3.5">Valid Until</th>
                      <th className="p-3.5 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {discounts.map((disc) => (
                      <tr key={disc.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-sm text-[#0B1F3A] bg-[#F5F7FA] border border-[#E2E8F0] px-2.5 py-1 rounded">
                            {disc.code}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-[#15803D]">
                          {disc.discountPercent ? `${disc.discountPercent}% OFF` : `€${disc.discountAmount} OFF`}
                        </td>
                        <td className="p-3.5 font-mono text-[#64748B]">{formatPrice(disc.minSpend)}</td>
                        <td className="p-3.5 font-mono">
                          {disc.usedCount} / {disc.maxUsage}
                        </td>
                        <td className="p-3.5 text-[#64748B]">{disc.validUntil}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => toggleDiscountActive(disc.id)}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                              disc.active
                                ? 'bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20'
                                : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                            }`}
                          >
                            {disc.active ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              8. AUDIT SECURITY LOG
             ========================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                  Administrative Audit Logs ({auditLogs.length})
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Immutable chronological audit record of ticket changes, price modifications, and refunds.
                </p>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Target Record</th>
                      <th className="p-3.5">Change Summary</th>
                      <th className="p-3.5 text-right">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5 text-[#64748B] font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#123B67]/10 text-[#123B67]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[#0B1F3A] font-semibold">{log.targetRecord}</td>
                        <td className="p-3.5 text-[#111827] max-w-md">{log.changeSummary}</td>
                        <td className="p-3.5 text-right font-mono text-[11px] text-[#64748B]">
                          {log.actorEmail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              INVENTORY LEDGER (Double-entry mutation log)
             ========================================== */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide flex items-center gap-2">
                    <span>Inventory Ledger & Mutation Audit</span>
                    <span className="text-xs font-mono font-normal text-[#64748B]">({inventoryLedger.length} events)</span>
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Immutable double-entry inventory ledger recording reservations, payment deductions, stock releases, and promoter adjustments.
                  </p>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Mutation Type</th>
                      <th className="p-3.5">Ticket Allocation</th>
                      <th className="p-3.5">Stock Delta</th>
                      <th className="p-3.5">Balance</th>
                      <th className="p-3.5">Reference ID</th>
                      <th className="p-3.5">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {inventoryLedger.map((mut) => (
                      <tr key={mut.id} className="hover:bg-[#F5F7FA]">
                        <td className="p-3.5 font-mono text-[#64748B] text-[11px] whitespace-nowrap">
                          {new Date(mut.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            mut.type === 'PAYMENT_CONFIRMED_DEDUCTED'
                              ? 'bg-[#123B67]/10 text-[#123B67]'
                              : mut.type === 'REFUND_RESTOCKED'
                              ? 'bg-[#15803D]/10 text-[#15803D]'
                              : mut.type === 'ADMIN_ADJUSTED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-[#64748B]'
                          }`}>
                            {mut.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-[#0B1F3A]">
                          {mut.ticketName}
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          <span className={mut.quantityDelta < 0 ? 'text-red-600' : 'text-[#15803D]'}>
                            {mut.quantityDelta > 0 ? `+${mut.quantityDelta}` : mut.quantityDelta}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[#64748B] text-[11px] whitespace-nowrap">
                          {mut.previousStock} &rarr; <strong className="text-[#0B1F3A]">{mut.newStock}</strong>
                        </td>
                        <td className="p-3.5 font-mono text-[#123B67] font-semibold text-[11px]">
                          {mut.referenceId}
                        </td>
                        <td className="p-3.5 text-[#64748B] max-w-xs text-[11px]">
                          {mut.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              QA LIFECYCLE AUDIT RUNNER
             ========================================== */}
          {activeTab === 'qa_runner' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                    Automated Booking Lifecycle & Verification Audit
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Execute automated integration verification across ticket reservations, Stripe sessions, idempotency, ticket collision prevention, and public enquiry PII redaction.
                  </p>
                </div>

                <button
                  onClick={handleRunAudit}
                  disabled={isRunningAudit}
                  className="px-5 py-2.5 bg-[#123B67] hover:bg-[#1D5288] disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                >
                  <Play className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
                  <span>{isRunningAudit ? 'Running Test Suites...' : 'Run Functional Audit Suite'}</span>
                </button>
              </div>

              {/* Status Header Cards */}
              {qaAuditReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Total Tests</span>
                    <span className="font-sports font-black text-2xl text-[#0B1F3A] mt-1 block">
                      {qaAuditReport.totalTests}
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Passed</span>
                    <span className="font-sports font-black text-2xl text-[#15803D] mt-1 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{qaAuditReport.passedCount}</span>
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Failed</span>
                    <span className={`font-sports font-black text-2xl mt-1 block ${qaAuditReport.failedCount > 0 ? 'text-[#B91C1C]' : 'text-[#64748B]'}`}>
                      {qaAuditReport.failedCount}
                    </span>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Execution Latency</span>
                    <span className="font-sports font-black text-2xl text-[#0B1F3A] mt-1 block font-mono">
                      {qaAuditReport.durationMs}ms
                    </span>
                  </div>
                </div>
              )}

              {/* Test Suites Accordion / Cards */}
              {qaAuditReport ? (
                <div className="space-y-6">
                  {qaAuditReport.suites.map((suite) => (
                    <div key={suite.category} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#F5F7FA] border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between">
                        <span className="font-sports font-black text-sm text-[#0B1F3A] uppercase tracking-wide">
                          {suite.category}
                        </span>
                        <span className="text-xs text-[#15803D] font-bold">
                          {suite.results.filter((r) => r.status === 'passed').length}/{suite.results.length} PASSED
                        </span>
                      </div>

                      <div className="divide-y divide-[#E2E8F0]">
                        {suite.results.map((test) => (
                          <div key={test.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F7FA]/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${test.status === 'passed' ? 'bg-[#15803D]' : 'bg-[#B91C1C]'}`} />
                                <strong className="text-xs text-[#0B1F3A] font-bold">{test.name}</strong>
                                <span className="font-mono text-[10px] text-[#64748B]">({test.executionTimeMs}ms)</span>
                              </div>
                              <p className="text-xs text-[#64748B]">{test.description}</p>
                              <p className="text-xs text-slate-700 font-mono bg-[#F5F7FA] px-2 py-1 rounded inline-block mt-1">
                                {test.details}
                              </p>
                            </div>

                            <div className="shrink-0 self-start sm:self-auto">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                                test.status === 'passed' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                              }`}>
                                {test.status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                <span>{test.status}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
                  <Play className="w-8 h-8 text-[#123B67] mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-sm text-[#0B1F3A]">Functional Audit Ready to Run</p>
                  <p className="mt-1 max-w-md mx-auto">
                    Click "Run Functional Audit Suite" above to test all 14 lifecycle modules in real time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              9. SYSTEM & API HEALTH
             ========================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                  System Architecture & Integration Health
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Active connection statuses for cloud database, payment gateway, and transactional mail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#0B1F3A]">Stripe Payments Engine</span>
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] text-[10px] font-bold uppercase">
                      Operational
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Instant tokenized checkout, Apple Pay & Google Pay authorization with zero foreign currency fees.
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#0B1F3A]">Resend Transactional Mail</span>
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] text-[10px] font-bold uppercase">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Barcoded e-ticket vouchers and tax invoices dispatched via promoter SMTP relay.
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#0B1F3A]">Cloud Firestore Sync</span>
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] text-[10px] font-bold uppercase">
                      Synced
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Real-time grandstand seat availability locking and high-concurrency order ledger.
                  </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#0B1F3A]">UAE Geolocation Currency</span>
                    <span className="px-2 py-0.5 rounded bg-[#15803D]/10 text-[#15803D] text-[10px] font-bold uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Auto-probes IP location: UAE visitors receive AED; international visitors receive USD.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ====================================================
          MODAL: ADD NEW EVENT
         ==================================================== */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 text-xs text-[#111827] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Add New Grand Prix Event
              </h3>
              <button onClick={() => setIsAddingEvent(false)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Formula 1 Abu Dhabi Grand Prix 2026"
                    value={eventForm.name}
                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Circuit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Yas Marina Circuit"
                    value={eventForm.circuit}
                    onChange={(e) => setEventForm({ ...eventForm, circuit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Location / City</label>
                  <input
                    type="text"
                    required
                    placeholder="Yas Island, Abu Dhabi"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="United Arab Emirates"
                    value={eventForm.country}
                    onChange={(e) => setEventForm({ ...eventForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Flag Emoji</label>
                  <input
                    type="text"
                    value={eventForm.flag}
                    onChange={(e) => setEventForm({ ...eventForm, flag: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Dates String</label>
                  <input
                    type="text"
                    required
                    placeholder="Dec 04 - Dec 06, 2026"
                    value={eventForm.dates}
                    onChange={(e) => setEventForm({ ...eventForm, dates: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Calendar Round #</label>
                  <input
                    type="number"
                    required
                    value={eventForm.round}
                    onChange={(e) => setEventForm({ ...eventForm, round: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Starting Price (€)</label>
                  <input
                    type="number"
                    required
                    value={eventForm.startingPrice}
                    onChange={(e) => setEventForm({ ...eventForm, startingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={eventForm.banner}
                  onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="evt-featured"
                  checked={eventForm.featured}
                  onChange={(e) => setEventForm({ ...eventForm, featured: e.target.checked })}
                  className="rounded text-[#123B67] accent-[#123B67]"
                />
                <label htmlFor="evt-featured" className="text-[#0B1F3A] font-bold cursor-pointer">
                  Feature on Homepage and Top Banners
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Save New Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: EDIT EVENT
         ==================================================== */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 text-xs text-[#111827] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Edit Grand Prix: {editingEvent.name}
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.name}
                    onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Circuit Name</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.circuit}
                    onChange={(e) => setEditingEvent({ ...editingEvent, circuit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Dates String</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.dates}
                    onChange={(e) => setEditingEvent({ ...editingEvent, dates: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Starting Price (€)</label>
                  <input
                    type="number"
                    required
                    value={editingEvent.startingPrice}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Status</label>
                  <select
                    value={editingEvent.status}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={editingEvent.banner}
                  onChange={(e) => setEditingEvent({ ...editingEvent, banner: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-evt-featured"
                  checked={editingEvent.featured}
                  onChange={(e) => setEditingEvent({ ...editingEvent, featured: e.target.checked })}
                  className="rounded text-[#123B67] accent-[#123B67]"
                />
                <label htmlFor="edit-evt-featured" className="text-[#0B1F3A] font-bold cursor-pointer">
                  Feature on Homepage
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Update Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: ADD NEW TICKET
         ==================================================== */}
      {isAddingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 text-xs text-[#111827] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Add Ticket / Grandstand Pass
              </h3>
              <button onClick={() => setIsAddingTicket(false)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Ticket Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Grandstand - Turn 5 Covered (3-Day)"
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Grand Prix Event</label>
                  <select
                    value={ticketForm.eventId}
                    onChange={(e) => setTicketForm({ ...ticketForm, eventId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Race Day Option</label>
                  <select
                    value={ticketForm.raceDay}
                    onChange={(e) => setTicketForm({ ...ticketForm, raceDay: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  >
                    <option value="3-Day Package">3-Day Package (Fri-Sun)</option>
                    <option value="Weekend Pass">Weekend Pass (Sat-Sun)</option>
                    <option value="Sunday">Sunday Race Day</option>
                    <option value="Saturday">Saturday Qualifying</option>
                    <option value="Friday">Friday Practice</option>
                    <option value="Thursday">Thursday Pit Walk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Grandstand / Sector</label>
                  <input
                    type="text"
                    required
                    placeholder="Turn 5 Hairpin Covered"
                    value={ticketForm.section}
                    onChange={(e) => setTicketForm({ ...ticketForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Price (€)</label>
                  <input
                    type="number"
                    required
                    value={ticketForm.price}
                    onChange={(e) => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Fee (€)</label>
                  <input
                    type="number"
                    required
                    value={ticketForm.fee}
                    onChange={(e) => setTicketForm({ ...ticketForm, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={ticketForm.capacity}
                    onChange={(e) => setTicketForm({ ...ticketForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Available Qty</label>
                  <input
                    type="number"
                    required
                    value={ticketForm.availableQuantity}
                    onChange={(e) => setTicketForm({ ...ticketForm, availableQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Ticket Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Note: Logic to upload to Cloudinary would go here.
                      // For now, storing as placeholder name or mock link
                      setTicketForm({ ...ticketForm, imageUrl: URL.createObjectURL(file) });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Features / Inclusions (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Covered Roof, Giant Screen View, Etihad Park Concerts Access"
                  value={ticketForm.features}
                  onChange={(e) => setTicketForm({ ...ticketForm, features: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddingTicket(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: EDIT TICKET
         ==================================================== */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 text-xs text-[#111827] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Edit Ticket: {editingTicket.name}
              </h3>
              <button onClick={() => setEditingTicket(null)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-4">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Ticket Name</label>
                <input
                  type="text"
                  required
                  value={editingTicket.name}
                  onChange={(e) => setEditingTicket({ ...editingTicket, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Section / Grandstand</label>
                  <input
                    type="text"
                    required
                    value={editingTicket.section}
                    onChange={(e) => setEditingTicket({ ...editingTicket, section: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Status</label>
                  <select
                    value={editingTicket.status}
                    onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="low_inventory">Low Inventory</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Price (€)</label>
                  <input
                    type="number"
                    required
                    value={editingTicket.price}
                    onChange={(e) => setEditingTicket({ ...editingTicket, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Fee (€)</label>
                  <input
                    type="number"
                    required
                    value={editingTicket.fee}
                    onChange={(e) => setEditingTicket({ ...editingTicket, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Available Qty</label>
                  <input
                    type="number"
                    required
                    value={editingTicket.availableQuantity}
                    onChange={(e) => setEditingTicket({ ...editingTicket, availableQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Total Capacity</label>
                  <input
                    type="number"
                    required
                    value={editingTicket.capacity}
                    onChange={(e) => setEditingTicket({ ...editingTicket, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Ticket Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Note: Logic to upload to Cloudinary would go here.
                      // For now, storing as placeholder name or mock link
                      setEditingTicket({ ...editingTicket, imageUrl: URL.createObjectURL(file) });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: ADD CATEGORY
         ==================================================== */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 text-xs text-[#111827] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Add Ticket Category
              </h3>
              <button onClick={() => setIsAddingCategory(false)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Covered Grandstands"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Slug Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. grandstand"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Badge Theme Color</label>
                <input
                  type="text"
                  value={categoryForm.badgeColor}
                  onChange={(e) => setCategoryForm({ ...categoryForm, badgeColor: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: EDIT CATEGORY
         ==================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 text-xs text-[#111827] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Edit Category: {editingCategory.name}
              </h3>
              <button onClick={() => setEditingCategory(null)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Badge Color Hex</label>
                <input
                  type="text"
                  value={editingCategory.badgeColor || '#0B1F3A'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, badgeColor: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: COMPOSE EMAIL
         ==================================================== */}
      {isComposingEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 text-xs text-[#111827] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#123B67]" />
                <span>Write Official Email (Resend SMTP)</span>
              </h3>
              <button onClick={() => setIsComposingEmail(false)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={emailForm.recipientEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sultan Al-Nuaimi"
                    value={emailForm.recipientName}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Email Template / Type</label>
                <select
                  value={emailForm.template}
                  onChange={(e) => setEmailForm({ ...emailForm, template: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                >
                  <option value="custom_announcement">Official Promoter Announcement</option>
                  <option value="race_schedule_update">Race Schedule & Gates Timing Update</option>
                  <option value="ticket_delivery">Barcoded E-Ticket Delivery</option>
                  <option value="customer_support">VIP Concierge & Hospitality Response</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="Important Notice: Abu Dhabi Grand Prix 2026 Weekend Schedule"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#64748B] font-bold mb-1">Message Body</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Dear valued attendee, your official Yas Marina Circuit covered grandstand pass is confirmed..."
                  value={emailForm.bodyText}
                  onChange={(e) => setEmailForm({ ...emailForm, bodyText: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsComposingEmail(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: CREATE DISCOUNT
         ==================================================== */}
      {isAddingDiscount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 text-xs text-[#111827] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase">
                Create Promotional Discount
              </h3>
              <button onClick={() => setIsAddingDiscount(false)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3">
              <div>
                <label className="block text-[#64748B] font-bold mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="YAS2026"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Discount %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={discountForm.discountPercent}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Max Usages</label>
                  <input
                    type="number"
                    required
                    value={discountForm.maxUsage}
                    onChange={(e) => setDiscountForm({ ...discountForm, maxUsage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Min Spend (€)</label>
                  <input
                    type="number"
                    value={discountForm.minSpend}
                    onChange={(e) => setDiscountForm({ ...discountForm, minSpend: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#64748B] font-bold mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    required
                    value={discountForm.validUntil}
                    onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddingDiscount(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: ORDER DETAILS
         ==================================================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 text-xs text-[#111827] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="font-sports font-black text-xl text-[#0B1F3A] uppercase">
                  Order Breakdown #{selectedOrderDetails.orderNumber}
                </h3>
                <span className="text-xs text-[#64748B]">Created on {new Date(selectedOrderDetails.createdAt).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Customer Information</span>
                  <div className="font-bold text-[#0B1F3A]">{selectedOrderDetails.customerName}</div>
                  <div className="font-mono text-[#64748B]">{selectedOrderDetails.customerEmail}</div>
                  <div className="text-[#64748B]">{selectedOrderDetails.customerPhone}</div>
                  <div className="text-[#64748B]">{selectedOrderDetails.customerCountry}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Financial & Gateway</span>
                  <div className="font-bold text-[#15803D] font-mono text-base">{formatPrice(selectedOrderDetails.total)}</div>
                  <div className="text-[#64748B]">Payment: {selectedOrderDetails.paymentMethod} (•••• {selectedOrderDetails.cardLast4 || '4242'})</div>
                  <div className="font-mono text-[10px] text-[#94A3B8]">Stripe: {selectedOrderDetails.paymentId || 'ch_simulated_3391'}</div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#15803D]/10 text-[#15803D]">
                      {selectedOrderDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tickets Issued with Barcodes */}
              <div>
                <h4 className="font-sports font-bold text-sm text-[#0B1F3A] uppercase mb-2">
                  Issued E-Ticket Passes ({selectedOrderDetails.tickets.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrderDetails.tickets.map((tkt, idx) => (
                    <div key={idx} className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#0B1F3A]">{tkt.eventName}</div>
                        <div className="text-[11px] text-[#64748B]">{tkt.category} · {tkt.section}</div>
                        <div className="font-mono text-[10px] text-[#123B67] mt-0.5">Attendee: {tkt.attendeeName}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-black bg-[#F5F7FA] px-2 py-1 rounded border border-[#E2E8F0] tracking-widest block">
                          {tkt.barcode}
                        </span>
                        <span className="text-[10px] text-[#15803D] font-semibold mt-1 inline-block">Gate Ready</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  onClick={() => {
                    handleResendEmail(selectedOrderDetails.id);
                  }}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Resend Confirmation Email
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-bold text-[#64748B] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: EVENT DETAILS INSPECTION
         ==================================================== */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 text-xs text-[#111827] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="font-sports font-black text-xl text-[#0B1F3A] uppercase">
                  {selectedEventDetails.name}
                </h3>
                <span className="text-xs text-[#64748B]">{selectedEventDetails.circuit} · {selectedEventDetails.dates}</span>
              </div>
              <button onClick={() => setSelectedEventDetails(null)} className="text-[#64748B] hover:text-[#0B1F3A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="h-44 rounded-xl overflow-hidden relative border border-[#E2E8F0]">
                <img
                  src={selectedEventDetails.banner}
                  alt={selectedEventDetails.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-center font-mono">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Round</span>
                  <span className="font-bold text-[#0B1F3A] text-sm">R{selectedEventDetails.round}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Laps</span>
                  <span className="font-bold text-[#0B1F3A] text-sm">{selectedEventDetails.numberOfLaps}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Lap Record</span>
                  <span className="font-bold text-[#123B67] text-xs">{selectedEventDetails.lapRecord.time}</span>
                </div>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed">
                {selectedEventDetails.description}
              </p>

              <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
                <button
                  onClick={() => setSelectedEventDetails(null)}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
