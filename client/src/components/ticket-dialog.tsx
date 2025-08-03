import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { TransactionWithDetails } from "@shared/schema";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithDetails | null;
}

export function TicketDialog({ open, onOpenChange, transaction }: TicketDialogProps) {
  const handlePrint = () => {
    const ticketContent = document.getElementById('ticket-content');
    if (!ticketContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px; 
              line-height: 1.2;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            th, td { 
              padding: 2px 0; 
              text-align: left;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-t { border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
            .border-b { border-bottom: 1px solid #000; margin-bottom: 4px; padding-bottom: 4px; }
          </style>
        </head>
        <body>${ticketContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  if (!transaction) return null;

  const ticketNumber = transaction.id.slice(-6).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Ticket de Venta</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </Button>
        </DialogHeader>
        
        <div id="ticket-content" className="font-mono text-sm space-y-4">
          <div className="text-center">
            <h2 className="font-bold text-lg">SISTEMA TPV</h2>
            <p>Punto de Venta</p>
            <p>NIF: B12345678</p>
            <p>Dirección de la Empresa</p>
            <p>Teléfono: +34 123 456 789</p>
          </div>
          
          <div className="border-t border-b border-gray-300 py-2">
            <p>Ticket: #{ticketNumber}</p>
            <p>Fecha: {formatDateTime(transaction.saleDate)}</p>
            <p>Cliente: {transaction.client.name}</p>
            <p>Atendido por: Administrador</p>
          </div>
          
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Producto</th>
                  <th className="text-right">€</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.quantity}x {item.productName} ({item.vatRate}%)
                    </td>
                    <td className="text-right">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span>{formatCurrency(transaction.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-1 mt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.total)}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Pago:</span>
              <span className="capitalize">{transaction.paymentMethod === 'cash' ? 'Efectivo' : 
                                         transaction.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
            </div>
          </div>
          
          <div className="text-center text-xs">
            <p>¡Gracias por su compra!</p>
            <p>IVA incluido</p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button onClick={handlePrint} className="bg-primary hover:bg-blue-700">
            <Printer className="mr-2" size={16} />
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
