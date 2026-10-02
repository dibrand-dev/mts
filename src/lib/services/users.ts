/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '../supabase/admin';
import { createUserInviteEmail } from '../brevo/templates';
import { sendBrevoEmail } from '../brevo/client';
import { InviteUserFormData } from '../schemas/users';

export interface UserProfileItem {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'accounting_auditor';
  isActive: boolean;
  createdAt: string;
  lastSignInAt?: string | null;
}

/**
 * Normalizes email address for consistent comparison and storage.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks if a given role is the Owner/Principal Administrator.
 */
export function isOwnerAdmin(role: string): boolean {
  return role === 'admin';
}

/**
 * Maps role to human-friendly display name in Spanish.
 */
export function getRoleDisplayName(role: 'admin' | 'accounting_auditor'): string {
  switch (role) {
    case 'admin':
      return 'Administrador (Owner)';
    case 'accounting_auditor':
      return 'Contable';
    default:
      return role;
  }
}

/**
 * Maps role to human-friendly permission summary.
 */
export function getRolePermissionSummary(role: 'admin' | 'accounting_auditor'): string {
  switch (role) {
    case 'admin':
      return 'Acceso total a carga de datos, catálogos, facturación y finanzas.';
    case 'accounting_auditor':
      return 'Acceso restringido de "Solo Lectura", limitado a visualizar reportes y exportar el Excel de liquidación mensual.';
    default:
      return '';
  }
}

/**
 * Fetches all registered users from the system with their auth state and profiles.
 * Requires admin privileges.
 */
export async function getUsersList(): Promise<UserProfileItem[]> {
  const adminClient = createAdminClient() as any;

  // 1. Fetch profiles from database
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
    throw new Error(`Error al obtener perfiles: ${profilesError.message}`);
  }

  // 2. Fetch auth users to supplement email and last_sign_in_at
  const authUsersMap = new Map<string, { email?: string; lastSignIn?: string | null }>();
  try {
    const { data: authData } = await adminClient.auth.admin.listUsers();
    if (authData?.users) {
      for (const u of authData.users) {
        authUsersMap.set(u.id, {
          email: u.email,
          lastSignIn: u.last_sign_in_at,
        });
      }
    }
  } catch (err: unknown) {
    console.warn('Could not fetch auth users directly:', err);
  }

  return (profiles || []).map((p: { id: string; full_name: string; email?: string | null; role: 'admin' | 'accounting_auditor'; is_active?: boolean; created_at: string }) => {
    const authInfo = authUsersMap.get(p.id);
    const email = p.email || authInfo?.email || 'Sin correo';
    return {
      id: p.id,
      fullName: p.full_name,
      email,
      role: p.role,
      isActive: p.is_active ?? true,
      createdAt: p.created_at,
      lastSignInAt: authInfo?.lastSignIn || null,
    };
  });
}

/**
 * Invites a new user to the platform by creating an account in Supabase Auth
 * and dispatching an invitation email with a link to set their password.
 */
export async function inviteUser(
  input: InviteUserFormData,
  originUrl?: string
): Promise<{
  success: boolean;
  user: UserProfileItem;
  inviteUrl?: string;
  emailDispatched: boolean;
}> {
  const adminClient = createAdminClient() as any;
  const normalizedEmail = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const role = input.role;

  const siteUrl = originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/change-password`;

  // 1. Check if user already exists in auth or profiles
  const { data: listData } = await adminClient.auth.admin.listUsers();
  const existingAuthUser = listData?.users?.find(
    (u: { email?: string }) => normalizeEmail(u.email || '') === normalizedEmail
  );

  let userId: string;
  let actionLink: string | undefined;

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    // Check if profile exists and update it
    await adminClient.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      email: normalizedEmail,
      role: role,
      is_active: true,
    });

    // Generate link to reset / set password for existing user
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: normalizedEmail,
      options: {
        redirectTo,
        data: { full_name: fullName, role, is_active: true },
      },
    });

    if (!linkErr && linkData?.properties?.action_link) {
      actionLink = linkData.properties.action_link;
    }
  } else {
    // 2. Create the user via inviteUserByEmail or generateLink
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          full_name: fullName,
          role: role,
          is_active: true,
        },
        redirectTo,
      }
    );

    if (inviteError) {
      // Fallback: If inviteUserByEmail fails (e.g. SMTP not configured in local environment),
      // generate an invite link or create user with generated link
      console.warn('inviteUserByEmail notice, generating invite link:', inviteError.message);

      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email: normalizedEmail,
        options: {
          redirectTo,
          data: {
            full_name: fullName,
            role: role,
            is_active: true,
          },
        },
      });

      if (linkError) {
        throw new Error(`Error al generar invitación en Supabase Auth: ${linkError.message}`);
      }

      if (linkData?.user) {
        userId = linkData.user.id;
      } else {
        throw new Error('No se pudo obtener el identificador de usuario generado');
      }

      actionLink = linkData.properties?.action_link;
    } else {
      userId = inviteData.user.id;

      // Also get the action link to include in high-contrast custom email
      try {
        const { data: linkData } = await adminClient.auth.admin.generateLink({
          type: 'invite',
          email: normalizedEmail,
          options: {
            redirectTo,
            data: { full_name: fullName, role, is_active: true },
          },
        });
        if (linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
        }
      } catch {
        // Link generation is secondary to Supabase's native invite
      }
    }

    // 3. Ensure profile is stored in database
    await adminClient.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      email: normalizedEmail,
      role: role,
      is_active: true,
    });
  }

  // 4. Dispatch branded email with Brevo EmailBuilder if link is available
  let emailDispatched = true;
  const inviteLink = actionLink || `${siteUrl}/login`;

  try {
    const emailBuilder = createUserInviteEmail({
      recipientEmail: normalizedEmail,
      fullName: fullName,
      role: role,
      inviteUrl: inviteLink,
    });

    const emailPayload = emailBuilder.build();
    await sendBrevoEmail({
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlContent: emailPayload.htmlContent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Error al despachar correo de bienvenida con Brevo:', msg);
    emailDispatched = false;
  }

  return {
    success: true,
    user: {
      id: userId,
      fullName: fullName,
      email: normalizedEmail,
      role: role,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    inviteUrl: inviteLink,
    emailDispatched,
  };
}

/**
 * Toggles a user's account state between active and inactive.
 * When set to inactive, the user is immediately banned/blocked from accessing the platform.
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean,
  currentAdminId?: string
): Promise<{ success: boolean; isActive: boolean }> {
  if (currentAdminId && currentAdminId === userId && !isActive) {
    throw new Error('No puedes desactivar tu propia cuenta de Administrador Principal.');
  }

  const adminClient = createAdminClient() as any;

  // 1. Update profiles table
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Error al actualizar estado en perfil: ${profileError.message}`);
  }

  // 2. Update Supabase Auth to immediately block/unblock the user
  try {
    if (!isActive) {
      // Ban user for 100 years (~876000 hours) to block session refresh immediately
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: '876000h',
        user_metadata: { is_active: false },
      });
    } else {
      // Lift the ban
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
        user_metadata: { is_active: true },
      });
    }
  } catch (authErr: unknown) {
    const msg = authErr instanceof Error ? authErr.message : String(authErr);
    console.warn('Aviso al actualizar ban_duration en Supabase Auth:', msg);
  }

  return { success: true, isActive };
}

/**
 * Updates a user's role in profiles and Supabase Auth metadata.
 */
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'accounting_auditor',
  currentAdminId?: string
): Promise<{ success: boolean; role: 'admin' | 'accounting_auditor' }> {
  if (currentAdminId && currentAdminId === userId && newRole !== 'admin') {
    throw new Error('No puedes revocar tu propio rol de Administrador Principal.');
  }

  const adminClient = createAdminClient() as any;

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Error al actualizar rol: ${profileError.message}`);
  }

  try {
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Aviso al actualizar rol en auth:', msg);
  }

  return { success: true, role: newRole };
}

/**
 * Resends the invitation email to a user with a fresh password generation link.
 */
export async function resendUserInvite(
  userId: string,
  originUrl?: string
): Promise<{ success: boolean; inviteUrl?: string }> {
  const adminClient = createAdminClient() as any;

  // Find user profile
  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', userId)
    .single();

  if (profileErr || !profile || !profile.email) {
    throw new Error('No se encontró el perfil o correo del usuario.');
  }

  const siteUrl = originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectTo = `${siteUrl}/change-password`;

  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email: profile.email,
    options: {
      redirectTo,
      data: {
        full_name: profile.full_name,
        role: profile.role,
        is_active: true,
      },
    },
  });

  if (linkErr) {
    throw new Error(`Error al generar enlace de invitación: ${linkErr.message}`);
  }

  const inviteUrl = linkData?.properties?.action_link || `${siteUrl}/change-password`;

  // Send branded email
  try {
    const emailBuilder = createUserInviteEmail({
      recipientEmail: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      inviteUrl,
    });
    const emailPayload = emailBuilder.build();
    await sendBrevoEmail({
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlContent: emailPayload.htmlContent,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('Aviso al enviar correo de reinvitación:', msg);
  }

  return { success: true, inviteUrl };
}
