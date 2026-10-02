import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  toggleUserStatus,
  updateUserRole,
  resendUserInvite,
} from '@/lib/services/users';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) return authCheck.errorResponse;

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'toggle_status') {
      const { isActive } = body;
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'El campo isActive (booleano) es requerido.' },
          { status: 400 }
        );
      }

      const result = await toggleUserStatus(targetUserId, isActive, authCheck.user.id);
      return NextResponse.json(result);
    }

    if (action === 'update_role') {
      const { role } = body;
      if (role !== 'admin' && role !== 'accounting_auditor') {
        return NextResponse.json(
          { success: false, error: 'El rol debe ser admin o accounting_auditor.' },
          { status: 400 }
        );
      }

      const result = await updateUserRole(targetUserId, role, authCheck.user.id);
      return NextResponse.json(result);
    }

    if (action === 'resend_invite') {
      const origin = request.nextUrl.origin;
      const result = await resendUserInvite(targetUserId, origin);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `Acción no soportada: ${action}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al actualizar usuario';
    console.error('[API /api/users/[id] PATCH Error]', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminAuth();
    if (!authCheck.authorized) return authCheck.errorResponse;

    const { id: targetUserId } = await params;

    if (targetUserId === authCheck.user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta de Administrador.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Error al eliminar usuario en auth: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Cascade delete profile if not automatic
    await adminClient.from('profiles').delete().eq('id', targetUserId);

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al eliminar usuario';
    console.error('[API /api/users/[id] DELETE Error]', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
