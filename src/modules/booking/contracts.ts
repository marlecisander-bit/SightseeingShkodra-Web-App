import type { PassengerCounts, PassengerCategories, PassengerSnapshot } from "./passengers";
/** V1 booking domain DTOs. Safe for type-only imports in browser/partner clients. */
export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "partially_refunded"
  | "refunded";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type HoldStatus = "active" | "released" | "expired" | "consumed";
export type AvailabilityRequest = {
  passengers?: PassengerCounts;
  version: 1;
  operatorId: string;
  productId: string;
  date: string;
  guests: number;
};
export type AvailabilityQuote = {
  businessDate?: string; nextOperationalDate?: string|null;
  categories?: PassengerCategories;
  version: 1;
  productId: string;
  date: string;
  guests: number;
  asOf: string;
  currency: "EUR";
  unitPrice: number;
  total: number;
  departures: {
    id: string;
    startTime: string;
    passengerQuote?: PassengerSnapshot;
    remaining: number;
    available: boolean;
  }[];
};
export type CreateHoldRequest = {
  passengers?: PassengerCounts;
  operatorId: string;
  departureId: string;
  sessionKey: string;
  requestId: string;
  quantity: number;
};
export type Hold = {
  passengerSnapshot?: PassengerSnapshot;
  id: string;
  departure_id: string;
  quantity: number;
  status: HoldStatus;
  expires_at: string;
};
export type CreatePendingOrderRequest = {
  operatorId: string;
  holdId: string;
  sessionKey: string;
  customer: { name: string; email: string; phone?: string };
};
export type BookingPass = {
  token: string;
  createdAt: string;
  checkedInAt: string | null;
  departures: { date: string; time: string; guests: number }[];
};
export type PendingOrder = {
  managementToken?: string;
  pass?: BookingPass;
  version: 1;
  orderId: string;
  status: OrderStatus;
  currency: "EUR";
  total: number;
  holdId: string;
  expiresAt: string;
  collectionMode?: "online" | "meeting_point";
  bookingReference?: string;
  bookingStatus?: BookingStatus;
  paymentStatus?: "due" | "paid";
  items: {
    id: string;
    productId: string;
    departureId: string;
    quantity: number;
    passengerSnapshot?: PassengerSnapshot;
    unitPrice: number;
    total: number;
    status: BookingStatus;
  }[];
};
export type Booking = {
  id: string;
  order_id: string;
  booking_reference: string;
  status: BookingStatus;
  confirmed_at: string | null;
};
export type CancellationResult = {
  version: 1;
  orderId: string;
  status: "cancelled";
  refundReviewRequired: boolean;
};
export type RefundReviewRequested = {
  eventType: "refund.review_requested";
  schemaVersion: 1;
  payload: { orderId: string };
};
