/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client';
import {
  CashMovementRow,
  CashMovementInsert,
  CashMovementUpdate,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
} from './cash-flow';

export { createCashMovement, updateCashMovement, deleteCashMovement };
export type { CashMovementRow, CashMovementInsert, CashMovementUpdate };

export interface ProjectedMovement {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  category: string; // 'Facturación', 'Sueldos', 'ARCA', 'ARBA', 'IVA', 'Comisiones', 'Proveedores', 'Otros'
  concept: string;
  amount: number;
  isManualMovement: boolean;
  movementId?: string;
  source: 'invoice' | 'proforma' | 'cash_movement';
  balanceAfter?: number;
}

export interface FinancialProjectionResult {
  targetDate: string;
  projectedIncome: number;
  projectedExpense: number;
  projectedBalance: number;
  movements: ProjectedMovement[];
}

/**
 * Consolidates all cash movements and pending billing (Facturación) up to targetDate.
 * Sorts automatically by date in ASCENDING order (ASC).
 * Calculates progressive accumulated balance (columna SALDO).
 */
export async function getFinancialProjections(targetDate: string): Promise<FinancialProjectionResult> {
  const supabase = createClient() as any;
  const today = new Date().toISOString().split('T')[0];

  const movements: ProjectedMovement[] = [];

  // 1. Fetch all cash_movements up to targetDate (includes Sueldos, ARCA, ARBA, IVA, Comisiones, Cobros manuales, etc.)
  try {
    const { data: cashRows, error: cashError } = await supabase
      .from('cash_movements')
      .select('*')
      .lte('movement_date', targetDate);

    if (cashError) {
      console.error('Error fetching cash movements for projection:', cashError);
    } else if (cashRows) {
      for (const m of cashRows) {
        movements.push({
          id: `cash-${m.id}`,
          date: m.movement_date,
          type: m.type,
          category: m.area,
          concept: m.detail,
          amount: Number(m.amount) || 0,
          isManualMovement: true,
          movementId: m.id,
          source: 'cash_movement',
        });
      }
    }
  } catch (err) {
    console.error('Error in cash_movements projection query:', err);
  }

  // 2. Fetch pending customer tax invoices (Facturación pendiente de cobro)
  try {
    const { data: invoices, error: invError } = await supabase
      .from('tax_invoices')
      .select(`
        id,
        invoice_number,
        invoiced_amount,
        status,
        invoice_date,
        proformas (
          id,
          proforma_number,
          due_date,
          clients (
            company_name,
            payment_due_days
          )
        )
      `)
      .eq('status', 'pending');

    if (!invError && invoices) {
      for (const inv of invoices) {
        const proforma = inv.proformas;
        const client = proforma?.clients;

        let estDate = proforma?.due_date;
        if (!estDate && inv.invoice_date) {
          const dueDays = Number(client?.payment_due_days) || 15;
          const d = new Date(inv.invoice_date);
          d.setDate(d.getDate() + dueDays);
          estDate = d.toISOString().split('T')[0];
        }
        if (!estDate) estDate = today;

        if (estDate <= targetDate) {
          const clientName = client?.company_name || 'Cliente';
          movements.push({
            id: `inv-${inv.id}`,
            date: estDate,
            type: 'income',
            category: 'Facturación',
            concept: `Cobro Factura #${inv.invoice_number} (${clientName})`,
            amount: Number(inv.invoiced_amount) || 0,
            isManualMovement: false,
            source: 'invoice',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching projected invoices:', err);
  }

  // 3. Fetch approved/sent proformas that do not have a tax invoice yet
  try {
    const { data: proformas, error: profError } = await supabase
      .from('proformas')
      .select(`
        id,
        proforma_number,
        total,
        status,
        due_date,
        issue_date,
        clients (
          company_name,
          payment_due_days
        ),
        tax_invoices (id)
      `)
      .in('status', ['approved', 'invoiced', 'sent']);

    if (!profError && proformas) {
      for (const prof of proformas) {
        // Skip if tax invoice already exists (prevent double count)
        if (prof.tax_invoices && prof.tax_invoices.length > 0) continue;

        let estDate = prof.due_date;
        if (!estDate && prof.issue_date) {
          const dueDays = Number(prof.clients?.payment_due_days) || 15;
          const d = new Date(prof.issue_date);
          d.setDate(d.getDate() + dueDays);
          estDate = d.toISOString().split('T')[0];
        }
        if (!estDate) estDate = today;

        if (estDate <= targetDate) {
          const clientName = prof.clients?.company_name || 'Cliente';
          movements.push({
            id: `prof-${prof.id}`,
            date: estDate,
            type: 'income',
            category: 'Facturación',
            concept: `Cobro Proforma #${prof.proforma_number} (${clientName})`,
            amount: Number(prof.total) || 0,
            isManualMovement: false,
            source: 'proforma',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching projected proformas:', err);
  }

  // 4. Sort STRICTLY ASCENDING by date (Criterio DoD: "ordenada automáticamente por fecha de manera ascendente")
  movements.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // Incomes first on same day, then expenses
    if (a.type !== b.type) {
      return a.type === 'income' ? -1 : 1;
    }
    return a.concept.localeCompare(b.concept);
  });

  // 5. Progressive running balance calculation (Criterio DoD: "columna SALDO que vaya sumando o restando el importe de esa fila al monto anterior, dando como resultado final la proyección a la fecha filtrada")
  let runningBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const mov of movements) {
    if (mov.type === 'income') {
      runningBalance += mov.amount;
      totalIncome += mov.amount;
    } else {
      runningBalance -= mov.amount;
      totalExpense += mov.amount;
    }
    mov.balanceAfter = runningBalance;
  }

  return {
    targetDate,
    projectedIncome: totalIncome,
    projectedExpense: totalExpense,
    projectedBalance: runningBalance,
    movements,
  };
}
