import { cn } from "@/lib/utils";
import { ScanBarcode, Home, Users, Receipt, BarChart3, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navigation = [
  { name: "Panel Principal", href: "/", icon: Home },
  { name: "Gestión de Clientes", href: "/clients", icon: Users },
  { name: "Nueva Venta", href: "/transactions", icon: Receipt },
  { name: "Informes", href: "/reports", icon: BarChart3 },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0 no-print">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <ScanBarcode className="text-primary mr-2" size={24} />
          Sistema TPV
        </h1>
      </div>
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.name}
                onClick={() => setLocation(item.href)}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="mr-3" size={20} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
