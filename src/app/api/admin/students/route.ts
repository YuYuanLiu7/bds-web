import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// 使用者資料列型別（部分欄位視資料庫遷移狀態而定，故皆為選填）
interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  membership_plan_id?: string | null;
  membership_expires_at?: string | null;
  created_at?: string;
}

// 寫入 users 資料表的欄位型別（依角色與遷移狀態動態組裝）
interface UserWriteData {
  name?: string;
  email?: string;
  password_hash?: string;
  role?: string;
  phone?: string;
  membership_plan_id?: string | null;
  membership_expires_at?: string | null;
}

// 1. GET：取得所有成員列表 (含電話、會員方案、到期日)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    let queryResult: UserRow[] | null = null;

    // A. 優先嘗試查詢完整欄位 (包含電話、會員方案與過期日)
    const { data: primaryData, error } = await supabase
      .from('users')
      .select('id, email, name, role, phone, membership_plan_id, membership_expires_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Attempted to select detailed columns but failed, trying fallback...", error.message);
      
      // B. 降級嘗試：有電話，但無會員方案 (例如 membership 尚未移轉時)
      const fallbackOne = await supabase
        .from('users')
        .select('id, email, name, role, phone, created_at')
        .order('created_at', { ascending: false });

      if (fallbackOne.error) {
        console.warn("Fallback one failed, trying absolute basic selection...", fallbackOne.error.message);
        
        // C. 極簡保底嘗試：無電話、無會員方案
        const fallbackBasic = await supabase
          .from('users')
          .select('id, email, name, role, created_at')
          .order('created_at', { ascending: false });

        if (fallbackBasic.error) throw fallbackBasic.error;
        queryResult = fallbackBasic.data;
      } else {
        queryResult = fallbackOne.data;
      }
    } else {
      queryResult = primaryData;
    }

    return NextResponse.json(queryResult || []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 2. POST：新增成員 (同時處理課程授權與會員訂閱)
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { name, email, phone, role, password, membershipPlanId, membershipExpiresAt, courseIds } = body;

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "請填寫必要欄位 (姓名、信箱、密碼、角色)" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密碼長度至少需要 6 位" }, { status: 400 });
    }

    // 檢查信箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "此信箱已被註冊" }, { status: 400 });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 12);

    // 構建寫入 users 的資料
    const insertData: UserWriteData = {
      name,
      email,
      password_hash: hashedPassword,
      role
    };

    if (phone) insertData.phone = phone;
    
    // 如果是學員，則載入訂閱方案與到期日
    if (role === 'user' || role === 'student') {
      if (membershipPlanId) insertData.membership_plan_id = membershipPlanId;
      if (membershipExpiresAt) insertData.membership_expires_at = membershipExpiresAt;
    }

    // A. 寫入使用者主表
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (userError) {
      console.error("Insert user error:", userError);
      
      // 萬一 phone 或 membership 欄位不存在，採取保底嘗試 (只寫入最基本欄位)
      console.warn("DB insert error, retrying with absolute minimum fields...");
      const basicInsert: UserWriteData = {
        name,
        email,
        password_hash: hashedPassword,
        role
      };
      
      const retryResult = await supabase
        .from('users')
        .insert([basicInsert])
        .select()
        .single();

      if (retryResult.error) throw retryResult.error;
      
      // 如果重試成功，將新 user 綁定為 newUser 以繼續後續流程
      return NextResponse.json(retryResult.data);
    }

    // B. 如果是學員且勾選了線上課程，同步寫入 user_courses
    if ((role === 'user' || role === 'student') && newUser && Array.isArray(courseIds) && courseIds.length > 0) {
      const insertRows = courseIds.map((courseId: string) => ({
        user_id: newUser.id,
        course_id: courseId,
        purchased_at: new Date().toISOString()
      }));

      const { error: coursesError } = await supabase
        .from('user_courses')
        .insert(insertRows);

      if (coursesError) {
        console.error("Batch insert course permissions error:", coursesError);
        // 這邊僅記錄錯誤，不讓主程序中斷 (因為學員已經註冊成功，管理員可以後續重設課程)
      }
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("POST admin student error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 3. PUT：更新成員資料 (同時同步處理課程授權與會員訂閱)
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { id, name, email, phone, role, password, membershipPlanId, membershipExpiresAt, courseIds } = body;

    if (!id || !email || !name || !role) {
      return NextResponse.json({ error: "缺漏必要資料" }, { status: 400 });
    }

    // 檢查是否有同信箱的其他使用者
    const { data: duplicateUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle();

    if (duplicateUser) {
      return NextResponse.json({ error: "此信箱已被其他成員佔用" }, { status: 400 });
    }

    // 構建更新資料
    const updateData: UserWriteData = {
      name,
      email,
      role,
      membership_plan_id: null,      // 先預設為 null 以便在取消訂閱時清空
      membership_expires_at: null   // 先預設為 null 以便在取消訂閱時清空
    };

    if (phone !== undefined) updateData.phone = phone;

    // 如果是學員，則載入訂閱方案與到期日
    if (role === 'user' || role === 'student') {
      if (membershipPlanId) updateData.membership_plan_id = membershipPlanId;
      if (membershipExpiresAt) updateData.membership_expires_at = membershipExpiresAt;
    } else {
      // 非學員身分，清空訂閱
      delete updateData.membership_plan_id;
      delete updateData.membership_expires_at;
    }

    // 如果有填寫密碼，則重新加密更新
    if (password && password.trim().length >= 6) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    // A. 更新使用者主表
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (userError) {
      console.error("Update user error:", userError);
      
      // 萬一 phone/membership 欄位在 DB 中有問題，採取降級更新
      console.warn("DB update error, retrying basic fields update...");
      const basicUpdate: UserWriteData = {
        name,
        email,
        role
      };
      if (password && password.trim().length >= 6) {
        basicUpdate.password_hash = updateData.password_hash;
      }

      const retryResult = await supabase
        .from('users')
        .update(basicUpdate)
        .eq('id', id)
        .select()
        .single();

      if (retryResult.error) throw retryResult.error;
      return NextResponse.json(retryResult.data);
    }

    // B. 如果是學員，同步處理課程授權 (批次更新 user_courses)
    if ((role === 'user' || role === 'student') && Array.isArray(courseIds)) {
      // 1. 先清除此學員舊有的所有課程權限
      const { error: deleteError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', id);

      if (deleteError) {
        console.error("Failed to delete user old course permissions:", deleteError);
      } else if (courseIds.length > 0) {
        // 2. 寫入勾選的新課程權限
        const insertRows = courseIds.map((courseId: string) => ({
          user_id: id,
          course_id: courseId,
          purchased_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('user_courses')
          .insert(insertRows);

        if (insertError) {
          console.error("Failed to insert user new course permissions:", insertError);
        }
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT admin student error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 4. DELETE：刪除成員 ( user_courses 因 FOREIGN KEY CASCADE 級聯刪除，不需多慮)
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "缺少成員 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "成員已被刪除" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
