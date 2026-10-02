import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsersList, inviteUser } from '@/lib/services/users';
import { inviteUserSchema } from '@/lib/schemas/users';

/**
 * Helper to ensure the requesting user is an active Administrator.
 */
async function verifyAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false as const,
      errorResponse: NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere iniciar sesión.' },
        { status: 401 }
      ),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = (await (supabase as any)
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()) as { data: { role?: string; is_active?: boolean } | null };

  const isRoleAdmin = profile?.role === 'admin';
  const isActive = profile?.is_active !== false;

  if (!isRoleAdmin || !isActive) {
    return {
      authorized: false as const,
      errorResponse: NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requiere rol de Administrador Principal.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true as const, user, profile };
}

export async function GET() {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) return authCheck.errorResponse;

    const users = await getUsersList();
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al listar usuarios';
    console.error('[API /api/users GET Error]', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) return authCheck.errorResponse;

    const body = await request.json();
    const parseResult = inviteUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Datos de usuario inválidos',
        },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;
    const result = await inviteUser(parseResult.data, origin);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al invitar usuario';
    console.error('[API /api/users POST Error]', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
