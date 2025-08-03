import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, X, ShoppingCart, Trash } from "lucide-react";
import { formatCurrency, calculateVat, getCurrentDateISO } from "@/lib/utils";
import { Client, InsertTransaction, InsertTransactionItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TicketDialog } from "@/components/ticket-dialog";

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export default function Transactions() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [saleDate, setSaleDate] = useState(getCurrentDateISO());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  
  // Form state for adding products
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [vatRate, setVatRate] = useState(21);
  
  const { toast } = useToast();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: defaultClient } = useQuery<Client>({
    queryKey: ['/api/clients/default'],
    enabled: selectedClientId === "" && !clientsLoading,
  });

  // Set default client when loaded
  if (defaultClient && selectedClientId === "") {
    setSelectedClientId(defaultClient.id);
  }

  const addProduct = () => {
    if (!productName.trim() || !unitPrice || quantity <= 0) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos del producto.",
        variant: "destructive",
      });
      return;
    }

    const priceWithVat = parseFloat(unitPrice);
    const itemTotalWithVat = priceWithVat * quantity;
    const vatCalc = calculateVat(itemTotalWithVat, vatRate);

    const newItem: SaleItem = {
      productName: productName.trim(),
      quantity,
      unitPrice: priceWithVat,
      vatRate,
      subtotal: vatCalc.net,
      vatAmount: vatCalc.vat,
      total: vatCalc.gross,
    };

    setSaleItems([...saleItems, newItem]);
    
    // Reset form
    setProductName("");
    setQuantity(1);
    setUnitPrice("");
    setVatRate(21);
  };

  const removeProduct = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const clearSale = () => {
    setSaleItems([]);
    setProductName("");
    setQuantity(1);
    setUnitPrice("");
    setVatRate(21);
    setPaymentMethod('cash');
    setSaleDate(getCurrentDateISO());
    if (defaultClient) {
      setSelectedClientId(defaultClient.id);
    }
  };

  const completeSale = async () => {
    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe añadir al menos un producto a la venta.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClientId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente.",
        variant: "destructive",
      });
      return;
    }

    const totalSubtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = saleItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);

    const transactionData: InsertTransaction = {
      clientId: selectedClientId,
      saleDate: new Date(saleDate + 'T' + new Date().toTimeString().split(' ')[0]),
      subtotal: totalSubtotal.toString(),
      vatAmount: totalVat.toString(),
      total: totalAmount.toString(),
      paymentMethod,
    };

    const items: InsertTransactionItem[] = saleItems.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      vatRate: item.vatRate,
      subtotal: item.subtotal.toString(),
      vatAmount: item.vatAmount.toString(),
      total: item.total.toString(),
    }));

    try {
      const response = await apiRequest('POST', '/api/transactions', {
        transaction: transactionData,
        items,
      });
      
      const newTransaction = await response.json();
      setLastTransaction(newTransaction);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: "Venta completada",
        description: "La venta se ha registrado correctamente.",
      });
      
      clearSale();
      setShowTicket(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la venta.",
        variant: "destructive",
      });
    }
  };

  const saleSummary = {
    subtotal: saleItems.reduce((sum, item) => sum + item.subtotal, 0),
    vat: saleItems.reduce((sum, item) => sum + item.vatAmount, 0),
    total: saleItems.reduce((sum, item) => sum + item.total, 0),
  };

  if (clientsLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Nueva Venta</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Cliente</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Fecha de Venta</Label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Entry */}
              <Card>
                <CardContent className="p-4">
                  <h5 className="font-medium text-gray-800 mb-3">Añadir Producto</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Nombre del producto"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Precio € (IVA incl.)"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <RadioGroup
                      value={vatRate.toString()}
                      onValueChange={(value) => setVatRate(parseInt(value))}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="21" id="vat21" />
                        <Label htmlFor="vat21">IVA 21%</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10" id="vat10" />
                        <Label htmlFor="vat10">IVA 10%</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4" id="vat4" />
                        <Label htmlFor="vat4">IVA 4%</Label>
                      </div>
                    </RadioGroup>
                    <Button onClick={addProduct} className="bg-secondary hover:bg-green-700">
                      <Plus className="mr-2" size={16} />
                      Añadir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Products List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Productos en la Venta</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {saleItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No hay productos añadidos
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {saleItems.map((item, index) => (
                        <div key={index} className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{item.productName}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} x {formatCurrency(item.unitPrice)} (IVA {item.vatRate}%)
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-800">{formatCurrency(item.subtotal)}</p>
                                <p className="text-sm text-gray-600">+{formatCurrency(item.vatAmount)} IVA</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumen de la Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(saleSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA:</span>
                  <span className="font-medium">{formatCurrency(saleSummary.vat)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-800">Total:</span>
                    <span className="font-bold text-gray-800">{formatCurrency(saleSummary.total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={completeSale}
                  className="w-full bg-primary hover:bg-blue-700 py-3"
                  disabled={saleItems.length === 0}
                >
                  <ShoppingCart className="mr-2" size={16} />
                  Completar Venta
                </Button>
                <Button 
                  onClick={clearSale}
                  variant="outline"
                  className="w-full"
                >
                  <Trash className="mr-2" size={16} />
                  Limpiar Todo
                </Button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h5 className="font-medium text-gray-800 mb-2">Métodos de Pago</h5>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'transfer')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Efectivo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Tarjeta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer">Transferencia</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TicketDialog
        open={showTicket}
        onOpenChange={setShowTicket}
        transaction={lastTransaction}
      />
    </div>
  );
}
