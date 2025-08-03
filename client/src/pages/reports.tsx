import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, BarChart3, Euro, Coins, Percent, CreditCard, Banknote, Repeat } from "lucide-react";
import { formatCurrency, formatDate, formatTime, getCurrentDateISO } from "@/lib/utils";
import { TransactionWithDetails } from "@shared/schema";

export default function Reports() {
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState("daily");
  const [startDate, setStartDate] = useState(getCurrentDateISO());
  const [endDate, setEndDate] = useState(getCurrentDateISO());
  
  // Clear all report caches on component mount to force fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
  }, [queryClient]);

  // Calculate date ranges based on report type
  const getDateRange = () => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    switch (reportType) {
      case "daily":
        // Use today's date for daily reports
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        start = new Date(today.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const dateRange = reportType === "custom" 
    ? { startDate: startDate || getCurrentDateISO(), endDate: endDate || getCurrentDateISO() }
    : getDateRange();

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery<TransactionWithDetails[]>({
    queryKey: ['/api/reports/transactions', dateRange.startDate, dateRange.endDate],
    queryFn: () => {
      const startDate = dateRange.startDate || getCurrentDateISO();
      const endDate = dateRange.endDate || getCurrentDateISO();
      console.log("Frontend: Making request with dates", { startDate, endDate });
      return fetch(`/api/reports/transactions?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Error loading transactions');
        return res.json();
      });
    },
    retry: 3,
    enabled: !!(dateRange.startDate && dateRange.endDate),
  });

  const { data: vatBreakdown = { vat21: { base: 0, vat: 0, total: 0 }, vat10: { base: 0, vat: 0, total: 0 }, vat4: { base: 0, vat: 0, total: 0 } }, isLoading: vatLoading } = useQuery({
    queryKey: ['/api/reports/vat-breakdown', dateRange.startDate, dateRange.endDate],
    queryFn: () => {
      const startDate = dateRange.startDate || getCurrentDateISO();
      const endDate = dateRange.endDate || getCurrentDateISO();
      console.log("Frontend VAT: Making request with dates", { startDate, endDate });
      return fetch(`/api/reports/vat-breakdown?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Error loading VAT breakdown');
        return res.json();
      });
    },
    retry: 3,
    enabled: !!(dateRange.startDate && dateRange.endDate),
  });

  const { data: paymentBreakdown = { cash: 0, card: 0, transfer: 0 }, isLoading: paymentLoading } = useQuery({
    queryKey: ['/api/reports/payment-methods', dateRange.startDate, dateRange.endDate],
    queryFn: () => {
      const startDate = dateRange.startDate || getCurrentDateISO();
      const endDate = dateRange.endDate || getCurrentDateISO();
      console.log("Frontend Payment: Making request with dates", { startDate, endDate });
      return fetch(`/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Error loading payment methods');
        return res.json();
      });
    },
    retry: 3,
    enabled: !!(dateRange.startDate && dateRange.endDate),
  });

  const handlePrintReport = () => {
    window.print();
  };

  const calculateTotals = () => {
    if (!transactions || !Array.isArray(transactions)) {
      return { grossSales: 0, netSales: 0, totalVat: 0 };
    }
    
    const grossSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const netSales = transactions.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
    const totalVat = transactions.reduce((sum, t) => sum + parseFloat(t.vatAmount), 0);

    return { grossSales, netSales, totalVat };
  };

  const totals = calculateTotals();

  if (transactionsLoading || vatLoading || paymentLoading) {
    return <div className="flex items-center justify-center h-full">Cargando informes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Informes</h3>
        <div className="flex space-x-2 no-print">
          <Button onClick={handlePrintReport} className="bg-green-600 hover:bg-green-700">
            <Printer className="mr-2" size={16} />
            Imprimir Informe Diario
          </Button>
          <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
            <Download className="mr-2" size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card className="no-print">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Tipo de Informe</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === "custom" && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Fecha Fin</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <Button className="bg-primary hover:bg-blue-700 w-full">
                <BarChart3 className="mr-2" size={16} />
                Generar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Brutas</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totals.grossSales)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Euro className="text-blue-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">Incluye IVA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Netas</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totals.netSales)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Coins className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">Sin IVA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IVA Total</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totals.totalVat)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="text-orange-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-orange-600 mt-2">Desglose por tipos</p>
          </CardContent>
        </Card>
      </div>

      {/* VAT and Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Desglose de IVA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vatBreakdown && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">IVA 21%</p>
                    <p className="text-sm text-gray-600">Base: {formatCurrency(vatBreakdown.vat21.base)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(vatBreakdown.vat21.vat)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(vatBreakdown.vat21.total)} total</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">IVA 10%</p>
                    <p className="text-sm text-gray-600">Base: {formatCurrency(vatBreakdown.vat10.base)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(vatBreakdown.vat10.vat)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(vatBreakdown.vat10.total)} total</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">IVA 4%</p>
                    <p className="text-sm text-gray-600">Base: {formatCurrency(vatBreakdown.vat4.base)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(vatBreakdown.vat4.vat)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(vatBreakdown.vat4.total)} total</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentBreakdown && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Banknote className="text-green-600 mr-3" size={20} />
                    <span className="font-medium text-gray-800">Efectivo</span>
                  </div>
                  <span className="font-bold text-gray-800">{formatCurrency(paymentBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="text-blue-600 mr-3" size={20} />
                    <span className="font-medium text-gray-800">Tarjeta</span>
                  </div>
                  <span className="font-bold text-gray-800">{formatCurrency(paymentBreakdown.card)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Repeat className="text-purple-600 mr-3" size={20} />
                    <span className="font-medium text-gray-800">Transferencia</span>
                  </div>
                  <span className="font-bold text-gray-800">{formatCurrency(paymentBreakdown.transfer)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card id="printable-report">
        <div className="p-6 border-b border-gray-200 no-print">
          <h4 className="text-lg font-medium text-gray-800">Informe Detallado de Ventas</h4>
        </div>
        
        {/* Print Header */}
        <div className="print-only p-6 text-center border-b">
          <h2 className="text-2xl font-bold">INFORME DIARIO DE VENTAS</h2>
          <p className="text-lg mt-2">Sistema TPV - Punto de Venta</p>
          <p className="mt-2">Fecha: {formatDate(new Date())}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay transacciones en el período seleccionado
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(transaction.saleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.client.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.items.map(item => item.productName).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.vatAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.paymentMethod === 'cash' ? 'Efectivo' : 
                       transaction.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                    TOTALES DEL PERÍODO
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(totals.netSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(totals.totalVat)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(totals.grossSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
