import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { cache } from "react";

/**
 * Get the current authenticated user from Supabase and database
 * @returns The user object from database or null if not authenticated
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  return user;
});
