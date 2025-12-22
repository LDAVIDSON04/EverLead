"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'What happens after I book an appointment?',
    answer: 'You\'ll receive an immediate confirmation email with appointment details and a calendar invitation. The agent will reach out 24 hours before your scheduled time to confirm and answer any preliminary questions.'
  },
  {
    question: 'Is payment refundable?',
    answer: 'Yes, appointments can be cancelled or rescheduled up to 24 hours in advance for a full refund. Cancellations within 24 hours are subject to a 50% cancellation fee.'
  },
  {
    question: 'What if I need to reschedule?',
    answer: 'You can reschedule your appointment anytime up to 24 hours before the scheduled time through your confirmation email or by contacting the agent directly. There are no fees for rescheduling.'
  },
  {
    question: 'Is my information private?',
    answer: 'Absolutely. All conversations and information shared are strictly confidential and protected under professional privacy guidelines. Your data is never shared with third parties without your explicit consent.'
  },
  {
    question: 'Do you offer in-person and virtual appointments?',
    answer: 'Yes, most agents offer both in-person meetings at their office and virtual appointments via secure video call for your convenience. Check with the specific agent for their available options.'
  }
];

export function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <div id="faqs" className="mb-12">
      <h3 className="mb-4">Frequently Asked Questions</h3>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900 pr-4">{faq.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-700">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
