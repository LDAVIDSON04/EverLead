// src/app/api/admin/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

type Expense = {
  id: string;
  expense_date: string;
  amount: number;
  description: string | null;
  channel: string | null;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    const { data: expenses, error } = await supabaseAdmin
      .from("marketing_expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json(
        { error: "Failed to fetch expenses" },
        { status: 500 }
      );
    }

    const totalExpenses = (expenses || []).reduce(
      (sum: number, exp: any) => sum + Number(exp.amount || 0),
      0
    );

    return NextResponse.json({
      expenses: expenses || [],
      totals: {
        totalExpenses,
      },
    });
  } catch (err) {
    console.error("Unexpected error fetching expenses:", err);
    return NextResponse.json(
      { error: "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { expense_date, amount, description, channel } = body;

    // Validate required fields
    if (!expense_date || !amount) {
      return NextResponse.json(
        { error: "expense_date and amount are required" },
        { status: 400 }
      );
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("marketing_expenses")
      .insert({
        expense_date,
        amount: amountNum,
        description: description || null,
        channel: channel || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return NextResponse.json(
        { error: "Failed to create expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ expense: data }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error creating expense:", err);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

