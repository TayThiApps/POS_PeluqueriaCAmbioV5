import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Euro, Receipt, Users, Percent, Printer, Edit, Trash, Eye } from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";
import { TransactionWithDetails } from "@shared/schema";
import { TicketDialog } from "@/components/ticket-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ['/api/transactions'],
  });

  const recentTransactions = transactions.slice(0, 5);

  const handlePrintTicket = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setShowTicket(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await apiRequest('DELETE', `/api/transactions/${transactionToDelete}`);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Transacción eliminada",
        description: "La transacción ha sido eliminada correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    }
  };

  if (statsLoading || transactionsLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(stats?.todaySales || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">
              ↗ +12% vs. ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.todayTransactions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="text-blue-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              ↗ +5 desde las 12:00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.activeClients || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-purple-600 mt-2">
              + 3 nuevos esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IVA Recaudado</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(stats?.vatCollected || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="text-orange-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">21% IVA incluido</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Transacciones Recientes</h3>
            <Button variant="link" className="text-primary">
              Ver todas →
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay transacciones recientes
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(transaction.saleDate)}
                      <br />
                      <span className="text-gray-500">Hoy</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintTicket(transaction)}
                        title="Imprimir ticket"
                      >
                        <Printer className="text-blue-600" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver detalles"
                      >
                        <Eye className="text-gray-600" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                      >
                        <Edit className="text-orange-600" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        title="Eliminar"
                      >
                        <Trash className="text-red-600" size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TicketDialog
        open={showTicket}
        onOpenChange={setShowTicket}
        transaction={selectedTransaction}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Confirmar Eliminación"
        description="¿Está seguro de que desea eliminar esta transacción? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
