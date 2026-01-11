"use client";

import { BotIdClient } from 'botid/client';

// Protected routes that need bot protection
const protectedRoutes = [
  {
    path: '/api/appointments/buy',
    method: 'POST',
  },
  {
    path: '/api/appointments/confirm',
    method: 'POST',
  },
  {
    path: '/api/checkout',
    method: 'POST',
  },
  {
    path: '/api/checkout/confirm',
    method: 'POST',
  },
  {
    path: '/api/agent/leads/confirm-purchase',
    method: 'POST',
  },
  {
    path: '/api/agent/signup',
    method: 'POST',
  },
  {
    path: '/api/agent/forgot-password',
    method: 'POST',
  },
  {
    path: '/api/leads/create',
    method: 'POST',
  },
];

export default function BotIdClientWrapper() {
  return <BotIdClient protect={protectedRoutes} />;
}
