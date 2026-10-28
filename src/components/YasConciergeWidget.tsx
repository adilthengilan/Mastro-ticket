import React, { useState } from 'react';
import { MessageSquare, X, Send, Phone, MapPin, CheckCircle2, Ticket } from 'lucide-react';
import { useStore } from '../services/store';

interface YasConciergeWidgetProps {
  navigate: (path: string) => void;
}

export const YasConciergeWidget: React.FC<YasConciergeWidgetProps> = ({ navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Marhaba! Welcome to Yas Island & Abu Dhabi Grand Prix Concierge. How can we assist your race weekend planning?',
      time: 'Just now'
    }
  ]);
  const { orders } = useStore();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userText = message;
    const newMsg = {
      sender: 'user' as const,
      text: userText,
      time: 'Just now'
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage('');

    setTimeout(() => {
      let botReply = 'Thank you for your message! Our Yas Marina Concierge team is reviewing your request. For immediate assistance with grandstand seat allocations or Paddock Club suites, call +971 (2) 659-9800.';
      const lower = userText.toLowerCase();

      if (lower.includes('ticket') || lower.includes('booking') || lower.includes('order')) {
        botReply = `You have ${orders.length} active booking(s) on file. You can access your official barcoded e-tickets immediately in the "Manage Booking" section.`;
      } else if (lower.includes('concert') || lower.includes('yasalam') || lower.includes('eminem')) {
        botReply = 'All 3-Day Abu Dhabi Grand Prix tickets include complimentary admission to all 4 nights of Yasalam After-Race Concerts at Etihad Park (Thursday to Sunday)!';
      } else if (lower.includes('park') || lower.includes('ferrari') || lower.includes('kid')) {
        botReply = 'Under the "Kids Go Free" initiative, children under 12 receive free access to Ferrari World, Warner Bros. World, and SeaWorld Yas Island with paying adults!';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: 'Just now'
        }
      ]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-[#123B67] hover:bg-[#1D5288] text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/60"
          title="Chat with Yas Island Concierge"
        >
          <MessageSquare className="w-6 h-6 fill-white text-white" />
        </button>
      )}

      {/* Expanded Concierge Drawer/Popover in Light Theme */}
      {isOpen && (
        <div className="w-[360px] sm:w-[380px] bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] text-[#111827] animate-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-[#0B1F3A] p-4 border-b border-[#163A63] flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#163A63] text-white font-black flex items-center justify-center font-sports text-xs tracking-wider border border-white/20">
                YAS
              </div>
              <div>
                <h3 className="font-sports font-black text-sm uppercase tracking-wide text-white flex items-center gap-1.5">
                  <span>Yas Island Concierge</span>
                  <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-300">Official Yas Marina Race Support</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#F5F7FA] px-3 py-2 border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto text-[11px] font-sports font-bold">
            <button
              onClick={() => navigate('/account')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#123B67] flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Ticket className="w-3 h-3" />
              <span>My E-Tickets</span>
            </button>
            <button
              onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0B1F3A] flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3 h-3 text-[#163A63]" />
              <span>Grandstands</span>
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#F5F7FA]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] font-helvetica leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#123B67] text-white rounded-br-xs font-medium shadow-xs'
                      : 'bg-white text-[#111827] rounded-bl-xs border border-[#E2E8F0] shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-[#64748B] mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Bottom Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about tickets, concerts, parks..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-full text-xs text-[#111827] placeholder-[#94A3B8] focus:border-[#123B67] focus:outline-none"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#123B67] text-white flex items-center justify-center hover:bg-[#1D5288] transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
