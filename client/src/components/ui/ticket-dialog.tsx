import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceipt } from '@/lib/print';
import type { TransactionWithDetails } from '@shared/schema';

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithDetails | null;
}

export function TicketDialog({ open, onOpenChange, transaction }: TicketDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Ticket-${transaction?.id.slice(-6)}`,
  });

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Ticket de Venta</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div ref={printRef}>
          <PrintableReceipt
            transaction={{
              id: transaction.id,
              date: transaction.date.toISOString(),
              client: transaction.client,
              items: transaction.items,
              subtotal: transaction.subtotal,
              vatAmount: transaction.vatAmount,
              total: transaction.total,
              paymentMethod: transaction.paymentMethod,
            }}
          />
        </div>
        
        <DialogFooter className="flex justify-end gap-2">
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
