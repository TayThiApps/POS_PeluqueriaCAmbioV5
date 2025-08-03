import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertTransactionSchema, insertTransactionItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clientes" });
    }
  });

  app.get("/api/clients/default", async (req, res) => {
    try {
      const client = await storage.getDefaultClient();
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cliente por defecto" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cliente" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear cliente" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar cliente" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener transacciones" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transacción no encontrada" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener transacción" });
    }
  });

  const createTransactionSchema = z.object({
    transaction: insertTransactionSchema,
    items: z.array(insertTransactionItemSchema)
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { transaction: transactionData, items } = createTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData, items);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear transacción" });
    }
  });

  const updateTransactionSchema = z.object({
    transaction: insertTransactionSchema.partial(),
    items: z.array(insertTransactionItemSchema).optional()
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const { transaction: transactionData, items } = updateTransactionSchema.parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, transactionData, items);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar transacción" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar transacción" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // Reports
  app.get("/api/reports/transactions", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      console.log("Reports/transactions request:", { startDate, endDate });
      
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined') {
        return res.status(400).json({ message: "Se requieren fechas de inicio y fin válidas" });
      }
      
      // Validate dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Fechas inválidas" });
      }
      
      // Set start to beginning of day and end to end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const transactions = await storage.getTransactionsByDateRange(start, end);
      console.log("Found transactions:", transactions.length);
      res.json(transactions);
    } catch (error) {
      console.error("Error in reports/transactions:", error);
      res.status(500).json({ message: "Error al obtener reporte de transacciones" });
    }
  });

  app.get("/api/reports/vat-breakdown", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      console.log("Reports/vat-breakdown request:", { startDate, endDate });
      
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined') {
        return res.status(400).json({ message: "Se requieren fechas de inicio y fin válidas" });
      }
      
      // Validate dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Fechas inválidas" });
      }
      
      // Set start to beginning of day and end to end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const breakdown = await storage.getVatBreakdown(start, end);
      console.log("VAT breakdown result:", breakdown);
      res.json(breakdown);
    } catch (error) {
      console.error("Error in reports/vat-breakdown:", error);
      res.status(500).json({ message: "Error al obtener desglose de IVA" });
    }
  });

  app.get("/api/reports/payment-methods", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      console.log("Reports/payment-methods request:", { startDate, endDate });
      
      if (!startDate || !endDate || startDate === 'undefined' || endDate === 'undefined') {
        return res.status(400).json({ message: "Se requieren fechas de inicio y fin válidas" });
      }
      
      // Validate dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Fechas inválidas" });
      }
      
      // Set start to beginning of day and end to end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const breakdown = await storage.getPaymentMethodBreakdown(start, end);
      console.log("Payment methods result:", breakdown);
      res.json(breakdown);
    } catch (error) {
      console.error("Error in reports/payment-methods:", error);
      res.status(500).json({ message: "Error al obtener desglose de métodos de pago" });
    }
  });

  // Initialize default client if it doesn't exist
  app.post("/api/init", async (req, res) => {
    try {
      const defaultClient = await storage.getDefaultClient();
      if (!defaultClient) {
        await storage.createClient({
          name: "Cliente Genérico",
          email: "",
          phone: "",
          nif: "",
          address: "",
          isDefault: true,
          isActive: true,
        });
      }
      res.json({ message: "Inicialización completada" });
    } catch (error) {
      res.status(500).json({ message: "Error en la inicialización" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
