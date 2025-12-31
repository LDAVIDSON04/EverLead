"use client";

import Image from "next/image";

interface Transaction {
  date: string;
  description: string;
  quantity: string;
  paid: string;
}

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
  transactions: Transaction[];
  total: string;
}

interface MonthlyStatementProps {
  data: StatementData;
}

export function MonthlyStatement({ data }: MonthlyStatementProps) {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Statement Document */}
        <div className="p-8 border-4 border-black">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-black">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="Soradin Logo"
                width={80}
                height={80}
                className="w-20 h-20"
              />
              <div>
                <h1 className="text-4xl font-bold text-black">SORADIN</h1>
              </div>
            </div>

            {/* Statement Title */}
            <div className="text-right">
              <h2 className="text-2xl font-bold" style={{ color: '#0a5f3a' }}>
                MONTHLY STATEMENT
              </h2>
              <p className="text-sm text-gray-600 mt-1">{data.monthName} {data.year}</p>
            </div>
          </div>

          {/* Statement Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Account Information */}
            <div>
              <h3 className="font-bold text-black mb-3" style={{ color: '#0a5f3a' }}>
                ACCOUNT INFORMATION
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-semibold text-black">{data.agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-semibold text-black">{data.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-semibold text-black">Business Account</span>
                </div>
              </div>
            </div>

            {/* Statement Period */}
            <div>
              <h3 className="font-bold text-black mb-3" style={{ color: '#0a5f3a' }}>
                STATEMENT PERIOD
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-semibold text-black">{data.statementPeriod.from}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-semibold text-black">{data.statementPeriod.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statement Date:</span>
                  <span className="font-semibold text-black">{data.statementPeriod.statementDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="mb-8">
            <h3 className="font-bold text-black mb-4" style={{ color: '#0a5f3a' }}>
              TRANSACTION HISTORY
            </h3>
            <div className="border-2 border-black">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="text-left p-3 text-sm">Date</th>
                    <th className="text-left p-3 text-sm">Description</th>
                    <th className="text-center p-3 text-sm">Quantity</th>
                    <th className="text-right p-3 text-sm">Balance Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-300"
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                      }}
                    >
                      <td className="p-3 text-sm text-gray-700">{transaction.date}</td>
                      <td className="p-3 text-sm text-black">{transaction.description}</td>
                      <td className="p-3 text-sm text-center text-black">{transaction.quantity}</td>
                      <td className="p-3 text-sm text-right text-black">
                        ${transaction.paid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Summary */}
          <div className="space-y-6">
            {/* Summary Box */}
            <div className="bg-gray-50 border-2 border-black p-6">
              <h3 className="font-bold text-black mb-4" style={{ color: '#0a5f3a' }}>
                STATEMENT SUMMARY
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="font-bold text-black">Total Balance Paid:</span>
                    <span className="font-semibold text-black">${data.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t-2 border-black text-center space-y-2">
              <p className="text-xs text-gray-500 mt-4">
                This is an official statement of account. Please retain for your records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

