import { Order } from '../types';

export interface OrderConfirmationDetails {
  orderId: string;
  eventName: string;
  venue: string;
  eventDate: string;
  section: string;
  row: string;
  ticketCount: number;
  customerName: string;
  customerEmail: string;
  paymentMethodLabel: string;
  totalFormatted: string;
  listingNote?: string;
}

export function extractOrderConfirmationDetails(
  order: Order,
  formatPrice: (amount: number) => string
): OrderConfirmationDetails {
  const firstItem = order.items[0];
  const firstTicket = order.tickets[0];
  const ticketCount =
    order.tickets.length > 0
      ? order.tickets.length
      : order.items.reduce((sum, item) => sum + item.quantity, 0);

  const eventName =
    firstItem?.eventName ||
    firstTicket?.eventName ||
    firstItem?.ticketName ||
    'Formula 1 Grand Prix Event';

  const venue =
    firstItem?.circuit ||
    firstTicket?.circuit ||
    'Hungaroring, Budapest';

  const eventDate =
    firstItem?.raceDay ||
    firstTicket?.raceDay ||
    'Date & Time to be Confirmed';

  const section =
    firstTicket?.section ||
    firstItem?.section ||
    firstItem?.ticketName ||
    'General Admission';

  const row = firstTicket?.row || firstItem?.seatDetails?.row || '—';

  const basePaymentMethod = order.paymentMethod || 'Stripe Card Payment';
  const paymentMethodLabel = order.cardLast4
    ? `${basePaymentMethod}: ************${order.cardLast4}`
    : basePaymentMethod;

  return {
    orderId: order.orderNumber,
    eventName,
    venue,
    eventDate,
    section,
    row,
    ticketCount,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    paymentMethodLabel,
    totalFormatted: formatPrice(order.total),
  };
}

export function buildOrderConfirmationSubject(orderNumber: string): string {
  return `Your order with order ID ${orderNumber} is confirmed`;
}

export function buildOrderConfirmationEmailBody(details: OrderConfirmationDetails): string {
  const year = new Date().getFullYear();

  return [
    `Your order with order ID ${details.orderId} is confirmed`,
    `From: MastroTickets <orders@mastrotickets.co>`,
    `To: ${details.customerEmail}`,
    '',
    `Congratulations! You're on your way to see ${details.eventName} at ${details.venue}!`,
    `Thank you for buying tickets for ${details.eventName} using MastroTickets!`,
    '',
    `The tickets you ordered will be delivered as a Mobile Ticket Transfer, a convenient and secure digital ticketing system.`,
    `- You will receive an email from either Ticketmaster or the team/venue when your tickets are available. If you don't see the email, check your spam folder for the phrase "Your Ticket Transfer".`,
    `- Once you receive the email, create or log in to your account. Remember to use the same email you provided when purchasing your order.`,
    `- Follow the instructions provided to complete the transfer.`,
    `- Download the mobile app associated with Ticketmaster or the team/venue.`,
    `- Present your mobile ticket to gain entry to your event.`,
    '',
    `Your tickets will be transferred to: ${details.customerEmail}`,
    `Note: In order to retrieve the tickets, you must create an account with Ticketmaster in the location of the country of the event. Please use the same email address that was used when purchasing the tickets on MastroTickets.`,
    `You can Track Your Order at any time at https://mastrotickets.co/account`,
    '',
    `When will I receive my tickets?`,
    `We are already in touch with the seller to ensure tickets are delivered as early as possible. Please note, tickets for live events are often not released until 24 hours before the event.`,
    `All sales are final. More questions? Check out our Frequently Asked Questions page at https://mastrotickets.co/help.`,
    '',
    `Event Information`,
    `Order ID: ${details.orderId}`,
    `Event: ${details.eventName}`,
    `Ticket(s): Section ${details.section}, Row ${details.row}, (${details.ticketCount} Ticket(s))`,
    `Venue: ${details.venue}`,
    `Date: ${details.eventDate} | Date & Time to be Confirmed`,
    '',
    `Order Information`,
    `Customer Name: ${details.customerName}`,
    `Payment Method: ${details.paymentMethodLabel}`,
    `Number of Tickets: ${details.ticketCount}`,
    `Total Charge: ${details.totalFormatted}`,
    '',
    `MastroTickets is a trusted ticket marketplace where you can find tickets for Formula 1 races, Concerts, Festivals, and Sports events.`,
    `Please do not reply to this message, as this email address does not accept incoming email. If you have any further enquiries please visit our Help Centre at https://mastrotickets.co/help.`,
    `Thank you for using MastroTickets!`,
    `Copyright © ${year} MastroTickets. All rights reserved. Privacy Policy | My Account`,
    '',
    `This email was sent by MastroTickets and may contain confidential or privileged information. If you are not the intended recipient, please delete the message, attachments, and notify the sender.`,
    `MastroTickets · Hungaroring, Budapest, Hungary.`,
    `Note: this address is not the Customer Service address. Any postal mail sent to this address will take a minimum of 14 days to reply, so please use our Help Centre (https://mastrotickets.co/help) or concierge@mastrotickets.co for a quicker response.`,
    `The following applies to any buyer who purchases tickets from a seller where MastroTickets acts as the seller's payment agent under our user agreement: MastroTickets is a limited payment collection agent of the seller, and your payment to us satisfies your obligation to the seller, subject to our user agreement.`,
  ].join('\n');
}
