import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient> | null;

/**
 * 确保 session 存在，如果不存在则创建
 * 处理竞态条件，确保线程安全
 */
export async function ensureSession(
  client: SupabaseAdminClient,
  sessionId: string,
  locale: string,
  tz: string,
): Promise<void> {
  if (!client) {
    throw new Error("Supabase client is not available");
  }

  // 先检查 session 是否存在
  const { data: existingSession, error: selectError } = await client
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  if (selectError) {
    console.error("[ensureSession] Select error:", selectError);
    throw new Error(`无法查询 session: ${selectError.message}`);
  }

  // 如果 session 不存在，创建它
  if (!existingSession) {
    console.log("[ensureSession] Session not found, creating:", { id: sessionId, locale, tz });
    const { error: insertError, data: insertedSession } = await client
      .from("sessions")
      .insert({ id: sessionId, locale, tz })
      .select("id")
      .single();

    if (insertError) {
      // 如果是唯一约束冲突，说明另一个请求已经创建了，再次查询确认
      if (insertError.code === "23505") {
        console.log("[ensureSession] Session already exists (race condition), verifying...");
        const { data: verifiedSession, error: verifyError } = await client
          .from("sessions")
          .select("id")
          .eq("id", sessionId)
          .maybeSingle();

        if (verifyError) {
          console.error("[ensureSession] Session verification error:", verifyError);
          throw new Error(`无法验证 session: ${verifyError.message}`);
        }

        if (!verifiedSession) {
          throw new Error("Session 创建失败：唯一约束冲突但验证时不存在");
        }

        console.log("[ensureSession] Session verified after race condition");
        return;
      }

      console.error("[ensureSession] Insert error:", insertError);
      throw new Error(`无法创建 session: ${insertError.message}`);
    }

    if (!insertedSession) {
      throw new Error("Session 创建失败：插入成功但未返回数据");
    }

    console.log("[ensureSession] Session created successfully:", insertedSession.id);
  } else {
    console.log("[ensureSession] Session already exists:", existingSession.id);
  }
}

/**
 * 验证 session 存在，如果不存在则创建（紧急情况）
 */
export async function verifyOrCreateSession(
  client: SupabaseAdminClient,
  sessionId: string,
  locale: string,
  tz: string,
): Promise<void> {
  if (!client) {
    throw new Error("Supabase client is not available");
  }

  const { data: sessionCheck, error: sessionCheckError } = await client
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionCheckError) {
    console.error("[verifyOrCreateSession] Session verification error:", sessionCheckError);
    throw new Error(`无法验证 session: ${sessionCheckError.message}`);
  }

  if (!sessionCheck) {
    console.error("[verifyOrCreateSession] Session not found, creating now...");
    // 紧急创建 session
    const { error: emergencyInsertError, data: emergencyInserted } = await client
      .from("sessions")
      .insert({ id: sessionId, locale, tz })
      .select("id")
      .single();

    if (emergencyInsertError) {
      // 如果是唯一约束冲突，说明另一个请求已经创建了
      if (emergencyInsertError.code === "23505") {
        console.log("[verifyOrCreateSession] Session already exists (race condition), verifying...");
        // 等待一小段时间，确保事务提交
        await new Promise(resolve => setTimeout(resolve, 100));
        // 再次验证
        const { data: verifiedAfterRace, error: verifyAfterRaceError } = await client
          .from("sessions")
          .select("id")
          .eq("id", sessionId)
          .maybeSingle();
        
        if (verifyAfterRaceError) {
          console.error("[verifyOrCreateSession] Verification after race condition error:", verifyAfterRaceError);
          throw new Error(`无法验证 session: ${verifyAfterRaceError.message}`);
        }
        
        if (!verifiedAfterRace) {
          throw new Error("Session 创建失败：唯一约束冲突但验证时不存在");
        }
        
        console.log("[verifyOrCreateSession] Session verified after race condition");
        return;
      }
      
      throw new Error(`紧急创建 session 失败: ${emergencyInsertError.message}`);
    }

    if (!emergencyInserted) {
      throw new Error("Session 创建失败：插入成功但未返回数据");
    }

    // 再次验证，确保 session 真的存在
    // 等待一小段时间，确保事务提交
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { data: finalCheck, error: finalCheckError } = await client
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();

    if (finalCheckError) {
      console.error("[verifyOrCreateSession] Final check error:", finalCheckError);
      throw new Error(`无法验证 session: ${finalCheckError.message}`);
    }

    if (!finalCheck) {
      throw new Error("Session 创建后仍然无法验证");
    }

    console.log("[verifyOrCreateSession] Session created in emergency and verified:", finalCheck.id);
  }
}

