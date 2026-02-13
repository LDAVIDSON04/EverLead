"use client";

import { useEffect } from "react";
import { MonthlyStatement } from "./MonthlyStatement";
import { Download, X } from "lucide-react";
import { escapeHtml } from "@/lib/escapeHtml";

interface StatementData {
  year: number;
  month: number;
  monthName: string;
  agentName: string;
  accountNumber: string;
  statementPeriod: {
    from: string;
    to: string;
    statementDate: string;
  };
  transactions: Array<{
    date: string;
    description: string;
    quantity: string;
    paid: string;
  }>;
  total: string;
}

interface StatementModalProps {
  open: boolean;
  onClose: () => void;
  data: StatementData | null;
  loading: boolean;
}

export function StatementModal({ open, onClose, data, loading }: StatementModalProps) {
  // Handle Esc key to close modal
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleDownload = async () => {
    if (!data) return;
    
    // Dynamically import html2pdf.js
    const html2pdf = (await import('html2pdf.js')).default;

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Statement - ${escapeHtml(data.monthName)} ${data.year}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: white; }
            .statement-container { max-width: 800px; margin: 0 auto; }
            .statement-border { padding: 32px; border: 4px solid black; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid black; }
            .logo-section { display: flex; align-items: center; gap: 16px; }
            .logo-section h1 { font-size: 36px; font-weight: bold; margin: 0; }
            .statement-title { text-align: right; }
            .statement-title h2 { font-size: 24px; font-weight: bold; color: #0a5f3a; margin: 0; }
            .statement-title p { font-size: 12px; color: #666; margin-top: 4px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
            .info-section h3 { font-weight: bold; color: #0a5f3a; margin-bottom: 12px; }
            .info-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
            .info-row span:first-child { color: #666; }
            .info-row span:last-child { font-weight: 600; }
            .transaction-table { margin-bottom: 32px; }
            .transaction-table h3 { font-weight: bold; color: #0a5f3a; margin-bottom: 16px; }
            table { width: 100%; border: 2px solid black; border-collapse: collapse; }
            thead { background: black; color: white; }
            th { text-align: left; padding: 12px; font-size: 14px; }
            th:last-child { text-align: right; }
            th:nth-child(3) { text-align: center; }
            tbody tr { border-bottom: 1px solid #ccc; }
            tbody tr:nth-child(even) { background: #f9f9f9; }
            tbody tr:nth-child(odd) { background: white; }
            td { padding: 12px; font-size: 14px; }
            td:last-child { text-align: right; }
            td:nth-child(3) { text-align: center; }
            .summary { background: #f3f4f6; border: 2px solid black; padding: 24px; margin-bottom: 24px; }
            .summary h3 { font-weight: bold; color: #0a5f3a; margin-bottom: 16px; }
            .summary-row { display: flex; gap: 8px; }
            .summary-row span:first-child { font-weight: bold; }
            .summary-row span:last-child { font-weight: 600; }
            .footer { padding-top: 24px; border-top: 2px solid black; text-align: center; }
            .footer p { font-size: 12px; color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="statement-container">
            <div class="statement-border">
              <div class="header">
                <div class="logo-section">
                  <div>
                    <h1>SORADIN</h1>
                  </div>
                </div>
                <div class="statement-title">
                  <h2>MONTHLY STATEMENT</h2>
                  <p>${escapeHtml(data.monthName)} ${data.year}</p>
                </div>
              </div>
              
              <div class="info-grid">
                <div class="info-section">
                  <h3>ACCOUNT INFORMATION</h3>
                  <div class="info-row"><span>Account Holder:</span><span>${escapeHtml(data.agentName)}</span></div>
                  <div class="info-row"><span>Account Number:</span><span>${escapeHtml(data.accountNumber)}</span></div>
                  <div class="info-row"><span>Account Type:</span><span>Business Account</span></div>
                </div>
                <div class="info-section">
                  <h3>STATEMENT PERIOD</h3>
                  <div class="info-row"><span>From:</span><span>${escapeHtml(data.statementPeriod.from)}</span></div>
                  <div class="info-row"><span>To:</span><span>${escapeHtml(data.statementPeriod.to)}</span></div>
                  <div class="info-row"><span>Statement Date:</span><span>${escapeHtml(data.statementPeriod.statementDate)}</span></div>
                </div>
              </div>
              
              <div class="transaction-table">
                <h3>TRANSACTION HISTORY</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Balance Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.transactions.map(t => `
                      <tr>
                        <td>${escapeHtml(t.date)}</td>
                        <td>${escapeHtml(t.description)}</td>
                        <td>${escapeHtml(t.quantity)}</td>
                        <td>$${escapeHtml(t.paid)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="summary">
                <h3>STATEMENT SUMMARY</h3>
                <div class="summary-row">
                  <span>Total Balance Paid:</span>
                  <span>$${escapeHtml(data.total)}</span>
                </div>
              </div>
              
              <div class="footer">
                <p>This is an official statement of account. Please retain for your records.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create a temporary container element and append to DOM (required for html2pdf)
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    const contentElement = (tempDiv.querySelector('.statement-container') || tempDiv) as HTMLElement;
    
    // Configure PDF options
    const opt = {
      margin: 0.5,
      filename: `Soradin_Statement_${data.monthName}_${data.year}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    // Generate and download PDF
    try {
      await html2pdf().set(opt).from(contentElement).save();
      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Clean up
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      // Fallback to print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl my-8">
        {/* Header with close and download */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Statement
          </h2>
          <div className="flex items-center gap-3">
            {data && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors text-sm"
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading statement...</p>
            </div>
          ) : data ? (
            <div className="p-8">
              <MonthlyStatement data={data} />
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600">No statement data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

