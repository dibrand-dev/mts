import { NextResponse } from 'next/server';
import { getProformaByToken } from '@/lib/services/invoicing';

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { token } = await params;
    const proforma = await getProformaByToken(token);

    if (!proforma) {
      return NextResponse.json(
        { success: false, error: 'Proforma no encontrada o enlace caducado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: proforma,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
