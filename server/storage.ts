import { 
  clients, 
  transactions, 
  transactionItems,
  type Client, 
  type InsertClient,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type TransactionWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

export interface IStorage {
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  getDefaultClient(): Promise<Client | undefined>;
  
  // Transaction operations
  getTransactions(): Promise<TransactionWithDetails[]>;
  getTransaction(id: string): Promise<TransactionWithDetails | undefined>;
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<TransactionWithDetails>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>, items?: InsertTransactionItem[]): Promise<TransactionWithDetails>;
  deleteTransaction(id: string): Promise<void>;
  
  // Reporting
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]>;
  getDashboardStats(): Promise<{
    todaySales: number;
    todayTransactions: number;
    activeClients: number;
    vatCollected: number;
  }>;
  getVatBreakdown(startDate: Date, endDate: Date): Promise<{
    vat21: { base: number; vat: number; total: number };
    vat10: { base: number; vat: number; total: number };
    vat4: { base: number; vat: number; total: number };
  }>;
  getPaymentMethodBreakdown(startDate: Date, endDate: Date): Promise<{
    cash: number;
    card: number;
    transfer: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updateClient: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set(updateClient)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getDefaultClient(): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.isDefault, true));
    return client || undefined;
  }

  async getTransactions(): Promise<TransactionWithDetails[]> {
    const result = await db
      .select()
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .orderBy(desc(transactions.createdAt));

    const grouped = new Map<string, TransactionWithDetails>();
    
    for (const row of result) {
      const transaction = row.transactions;
      const client = row.clients!;
      const item = row.transaction_items;

      if (!grouped.has(transaction.id)) {
        grouped.set(transaction.id, {
          ...transaction,
          client,
          items: []
        });
      }

      if (item) {
        grouped.get(transaction.id)!.items.push(item);
      }
    }

    return Array.from(grouped.values());
  }

  async getTransaction(id: string): Promise<TransactionWithDetails | undefined> {
    const result = await db
      .select()
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .where(eq(transactions.id, id));

    if (result.length === 0) return undefined;

    const transaction = result[0].transactions;
    const client = result[0].clients!;
    const items = result.filter(row => row.transaction_items).map(row => row.transaction_items!);

    return {
      ...transaction,
      client,
      items
    };
  }

  async createTransaction(insertTransaction: InsertTransaction, items: InsertTransactionItem[]): Promise<TransactionWithDetails> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();

    const itemsWithTransactionId = items.map(item => ({
      ...item,
      transactionId: transaction.id
    }));

    const createdItems = await db
      .insert(transactionItems)
      .values(itemsWithTransactionId)
      .returning();

    const client = await this.getClient(transaction.clientId);

    return {
      ...transaction,
      client: client!,
      items: createdItems
    };
  }

  async updateTransaction(id: string, updateTransaction: Partial<InsertTransaction>, items?: InsertTransactionItem[]): Promise<TransactionWithDetails> {
    const [transaction] = await db
      .update(transactions)
      .set(updateTransaction)
      .where(eq(transactions.id, id))
      .returning();

    if (items) {
      await db.delete(transactionItems).where(eq(transactionItems.transactionId, id));
      
      const itemsWithTransactionId = items.map(item => ({
        ...item,
        transactionId: id
      }));

      await db
        .insert(transactionItems)
        .values(itemsWithTransactionId);
    }

    const result = await this.getTransaction(id);
    return result!;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionWithDetails[]> {
    const result = await db
      .select()
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .where(and(
        gte(transactions.saleDate, startDate),
        lte(transactions.saleDate, endDate)
      ))
      .orderBy(desc(transactions.saleDate));

    const grouped = new Map<string, TransactionWithDetails>();
    
    for (const row of result) {
      const transaction = row.transactions;
      const client = row.clients!;
      const item = row.transaction_items;

      if (!grouped.has(transaction.id)) {
        grouped.set(transaction.id, {
          ...transaction,
          client,
          items: []
        });
      }

      if (item) {
        grouped.get(transaction.id)!.items.push(item);
      }
    }

    return Array.from(grouped.values());
  }

  async getDashboardStats(): Promise<{
    todaySales: number;
    todayTransactions: number;
    activeClients: number;
    vatCollected: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [salesResult] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
        vatCollected: sql<number>`COALESCE(SUM(${transactions.vatAmount}), 0)`
      })
      .from(transactions)
      .where(and(
        gte(transactions.saleDate, today),
        lte(transactions.saleDate, tomorrow)
      ));

    const [clientsResult] = await db
      .select({
        activeClients: sql<number>`COUNT(*)`
      })
      .from(clients)
      .where(eq(clients.isActive, true));

    return {
      todaySales: Number(salesResult.totalSales) || 0,
      todayTransactions: Number(salesResult.transactionCount) || 0,
      activeClients: Number(clientsResult.activeClients) || 0,
      vatCollected: Number(salesResult.vatCollected) || 0,
    };
  }

  async getVatBreakdown(startDate: Date, endDate: Date): Promise<{
    vat21: { base: number; vat: number; total: number };
    vat10: { base: number; vat: number; total: number };
    vat4: { base: number; vat: number; total: number };
  }> {
    const result = await db
      .select({
        vatRate: transactionItems.vatRate,
        totalBase: sql<number>`COALESCE(SUM(${transactionItems.subtotal}), 0)`,
        totalVat: sql<number>`COALESCE(SUM(${transactionItems.vatAmount}), 0)`,
        totalAmount: sql<number>`COALESCE(SUM(${transactionItems.total}), 0)`
      })
      .from(transactionItems)
      .leftJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(and(
        gte(transactions.saleDate, startDate),
        lte(transactions.saleDate, endDate)
      ))
      .groupBy(transactionItems.vatRate);

    const breakdown = {
      vat21: { base: 0, vat: 0, total: 0 },
      vat10: { base: 0, vat: 0, total: 0 },
      vat4: { base: 0, vat: 0, total: 0 },
    };

    for (const row of result) {
      const key = `vat${row.vatRate}` as keyof typeof breakdown;
      if (key in breakdown) {
        breakdown[key] = {
          base: Number(row.totalBase),
          vat: Number(row.totalVat),
          total: Number(row.totalAmount)
        };
      }
    }

    return breakdown;
  }

  async getPaymentMethodBreakdown(startDate: Date, endDate: Date): Promise<{
    cash: number;
    card: number;
    transfer: number;
  }> {
    const result = await db
      .select({
        paymentMethod: transactions.paymentMethod,
        total: sql<number>`COALESCE(SUM(${transactions.total}), 0)`
      })
      .from(transactions)
      .where(and(
        gte(transactions.saleDate, startDate),
        lte(transactions.saleDate, endDate)
      ))
      .groupBy(transactions.paymentMethod);

    const breakdown = {
      cash: 0,
      card: 0,
      transfer: 0,
    };

    for (const row of result) {
      const method = row.paymentMethod as keyof typeof breakdown;
      if (method in breakdown) {
        breakdown[method] = Number(row.total);
      }
    }

    return breakdown;
  }
}

export const storage = new DatabaseStorage();
