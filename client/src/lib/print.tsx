import React from 'react';

interface PrintableReceiptProps {
  transaction: {
    id: string;
    date: string;
    client: { name: string };
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      vatRate: string;
      itemTotal: string;
    }>;
    subtotal: string;
    vatAmount: string;
    total: string;
    paymentMethod: string;
  };
  companyInfo?: {
    name: string;
    nif: string;
    address: string;
    phone: string;
  };
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ 
  transaction, 
  companyInfo = {
    name: "Sistema TPV",
    nif: "B12345678",
    address: "Dirección de la Empresa",
    phone: "+34 123 456 789"
  }
}) => {
  return (
    <div className="font-mono text-sm max-w-sm mx-auto p-4">
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">{companyInfo.name}</h2>
        <p>Punto de Venta</p>
        <p>NIF: {companyInfo.nif}</p>
        <p>{companyInfo.address}</p>
        <p>Teléfono: {companyInfo.phone}</p>
      </div>
      
      <div className="border-t border-b border-gray-800 py-2 my-4">
        <p>Ticket: #{transaction.id.slice(-6)}</p>
        <p>Fecha: {new Date(transaction.date).toLocaleString('es-ES')}</p>
        <p>Cliente: {transaction.client.name}</p>
        <p>Atendido por: Administrador</p>
      </div>
      
      <div className="mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left">Producto</th>
              <th className="text-right">€</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.quantity}x {item.productName} ({parseFloat(item.vatRate)}%)
                </td>
                <td className="text-right">{parseFloat(item.itemTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-gray-800 pt-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>€{parseFloat(transaction.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA:</span>
          <span>€{parseFloat(transaction.vatAmount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-800 pt-1 mt-1">
          <span>TOTAL:</span>
          <span>€{parseFloat(transaction.total).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span>Pago:</span>
          <span className="capitalize">{transaction.paymentMethod}</span>
        </div>
      </div>
      
      <div className="text-center mt-4 text-xs">
        <p>¡Gracias por su compra!</p>
        <p>IVA incluido</p>
      </div>
    </div>
  );
};

interface PrintableDailyReportProps {
  transactions: Array<{
    id: string;
    date: string;
    client: { name: string };
    items: Array<{
      productName: string;
      quantity: number;
    }>;
    subtotal: string;
    vatAmount: string;
    total: string;
    paymentMethod: string;
  }>;
  reportDate: string;
  stats: {
    totalSales: number;
    vatByRate: Record<string, { base: number; vat: number; total: number }>;
    paymentMethods: Record<string, number>;
  };
}

export const PrintableDailyReport: React.FC<PrintableDailyReportProps> = ({ 
  transactions, 
  reportDate, 
  stats 
}) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">INFORME DIARIO DE VENTAS</h1>
        <p className="text-lg mt-2">Sistema TPV - Punto de Venta</p>
        <p className="mt-2">Fecha: {reportDate}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Resumen del Día</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Ventas Totales</p>
            <p className="text-xl font-bold">€{stats.totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Transacciones</p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Ticket Promedio</p>
            <p className="text-xl font-bold">
              €{transactions.length > 0 ? (stats.totalSales / transactions.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Desglose de IVA</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Tipo IVA</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Base Imponible</th>
              <th className="border border-gray-300 px-4 py-2 text-right">IVA</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.vatByRate).map(([rate, amounts]) => (
              <tr key={rate}>
                <td className="border border-gray-300 px-4 py-2">{rate}%</td>
                <td className="border border-gray-300 px-4 py-2 text-right">€{amounts.base.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">€{amounts.vat.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">€{amounts.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Detalle de Transacciones</h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 text-left">Hora</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Cliente</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Productos</th>
              <th className="border border-gray-300 px-2 py-1 text-right">Base</th>
              <th className="border border-gray-300 px-2 py-1 text-right">IVA</th>
              <th className="border border-gray-300 px-2 py-1 text-right">Total</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Pago</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="border border-gray-300 px-2 py-1">
                  {new Date(transaction.date).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </td>
                <td className="border border-gray-300 px-2 py-1">{transaction.client.name}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {transaction.items.map(item => `${item.productName}`).join(', ')}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  €{parseFloat(transaction.subtotal).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  €{parseFloat(transaction.vatAmount).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right font-medium">
                  €{parseFloat(transaction.total).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-2 py-1 capitalize">
                  {transaction.paymentMethod}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-gray-300 px-2 py-1">TOTALES DEL DÍA</td>
              <td className="border border-gray-300 px-2 py-1 text-right">
                €{Object.values(stats.vatByRate).reduce((sum, amounts) => sum + amounts.base, 0).toFixed(2)}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-right">
                €{Object.values(stats.vatByRate).reduce((sum, amounts) => sum + amounts.vat, 0).toFixed(2)}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-right">
                €{stats.totalSales.toFixed(2)}
              </td>
              <td className="border border-gray-300 px-2 py-1">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
