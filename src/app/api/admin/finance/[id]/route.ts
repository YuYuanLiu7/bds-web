import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "缺少訂單 ID" }, { status: 400 });
    }

    // Fetch order record joining user and course details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        users (id, name, email, phone, role),
        courses (id, title, thumbnail_url, price)
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "查無此訂單" }, { status: 404 });
    }

    // If this is a membership order, fetch membership plan details
    let membershipPlan = null;
    if (order.membership_plan_id) {
      try {
        const { data: plan } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('id', order.membership_plan_id)
          .single();
        membershipPlan = plan;
      } catch (err) {
        console.warn("Failed to fetch membership plan details for order:", err);
      }
    }

    return NextResponse.json({
      ...order,
      membershipPlan
    });

  } catch (error: any) {
    console.error("GET order detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
