import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Client, InsertClient } from "@shared/schema";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      nif: "",
      address: "",
      isDefault: false,
      isActive: true,
    },
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = () => {
    setEditingClient(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      nif: "",
      address: "",
      isDefault: false,
      isActive: true,
    });
    setShowClientDialog(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      nif: client.nif || "",
      address: client.address || "",
      isDefault: client.isDefault || false,
      isActive: client.isActive ?? true,
    });
    setShowClientDialog(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await apiRequest('DELETE', `/api/clients/${clientToDelete}`);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const onSubmit = async (data: InsertClient) => {
    try {
      if (editingClient) {
        await apiRequest('PUT', `/api/clients/${editingClient.id}`, data);
        toast({
          title: "Cliente actualizado",
          description: "El cliente ha sido actualizado correctamente.",
        });
      } else {
        await apiRequest('POST', '/api/clients', data);
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido creado correctamente.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowClientDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo ${editingClient ? 'actualizar' : 'crear'} el cliente.`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Gestión de Clientes</h3>
        <Button onClick={handleAddClient} className="bg-primary hover:bg-blue-700">
          <Plus className="mr-2" size={16} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Buscar cliente</Label>
              <Input
                placeholder="Nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="bg-gray-800 hover:bg-gray-700 w-full">
                <Search className="mr-2" size={16} />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIF/CIF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isDefault = client.isDefault;
                  
                  return (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                            isDefault ? 'bg-primary' : 'bg-purple-500'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            {isDefault && (
                              <div className="text-sm text-gray-500">Cliente por defecto</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.email || '-'}
                        <br />
                        <span className="text-gray-500">{client.phone || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.nif || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={client.isActive ? "default" : "secondary"}>
                          {client.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver detalles"
                        >
                          <Eye className="text-blue-600" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                          title="Editar"
                        >
                          <Edit className="text-orange-600" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={isDefault}
                          title={isDefault ? "No se puede eliminar el cliente por defecto" : "Eliminar"}
                        >
                          <Trash className={isDefault ? "text-gray-400" : "text-red-600"} size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+34 666 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIF/CIF</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678Z" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cliente activo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowClientDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClient ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Confirmar Eliminación"
        description="¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
