import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  ScanBarcode
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Panel Principal',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Gestión de Clientes',
    href: '/clients',
    icon: Users,
  },
  {
    name: 'Nueva Venta',
    href: '/transactions',
    icon: ShoppingCart,
  },
  {
    name: 'Informes',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ScanBarcode className="h-6 w-6 text-primary" />
          Sistema TPV
        </h1>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
