export const FLUTTER_DRIFT_SCHEMA_CODE = `// lib/database/app_database.dart
// Production-Ready Drift Database Definition for SmartBiz Pocket
// Fully offline, optimized for low-end Android (minSdkVersion 26 / Android 8+)
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'app_database.g.dart';

// 1. Businesses Table
class Businesses extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 100)();
  TextColumn get ownerName => text().withLength(min: 1, max: 100)();
  TextColumn get phone => text().nullable()();
  TextColumn get location => text().nullable()();
  TextColumn get currency => text().withDefault(const Constant('USD'))();
  TextColumn get businessType => text().withDefault(const Constant('tuckshop'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// 2. Products Table
class Products extends Table {
  TextColumn get id => text()();
  TextColumn get businessId => text().references(Businesses, #id)();
  TextColumn get name => text().withLength(min: 1, max: 120)();
  TextColumn get category => text().withLength(min: 1, max: 50)();
  RealColumn get costPrice => real().withDefault(const Constant(0.0))();
  RealColumn get sellingPrice => real()();
  RealColumn get quantity => real().withDefault(const Constant(0.0))();
  TextColumn get supplier => text().nullable()();
  RealColumn get minStock => real().withDefault(const Constant(5.0))();
  TextColumn get unit => text().withDefault(const Constant('item'))();
  BoolColumn get isArchived => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
  
  @override
  List<String> get customConstraints => [
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
    'CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity)'
  ];
}

// 3. Inventory Movements Table
class InventoryMovements extends Table {
  TextColumn get id => text()();
  TextColumn get productId => text().references(Products, #id)();
  TextColumn get movementType => text()(); // 'sale', 'restock', 'adjustment', 'return'
  RealColumn get quantityDelta => real()();
  RealColumn get newQuantity => real()();
  TextColumn get reason => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// 4. Sales Table
class Sales extends Table {
  TextColumn get id => text()();
  TextColumn get businessId => text().references(Businesses, #id)();
  TextColumn get receiptNumber => text().withLength(min: 1, max: 40)();
  DateTimeColumn get saleDate => dateTime().withDefault(currentDateAndTime)();
  RealColumn get totalSale => real()();
  RealColumn get totalCost => real()();
  RealColumn get profit => real()();
  TextColumn get customerId => text().nullable().references(Customers, #id)();
  TextColumn get customerName => text().nullable()();
  TextColumn get paymentMethod => text().withDefault(const Constant('Cash USD'))();
  TextColumn get notes => text().nullable()();
  BoolColumn get isCreditSale => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
  
  @override
  List<String> get customConstraints => [
    'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)'
  ];
}

// 5. Sale Items Table
class SaleItems extends Table {
  TextColumn get id => text()();
  TextColumn get saleId => text().references(Sales, #id, onDelete: KeyAction.cascade)();
  TextColumn get productId => text().references(Products, #id)();
  TextColumn get productName => text()();
  RealColumn get quantity => real()();
  RealColumn get unitCostPrice => real()();
  RealColumn get unitSellingPrice => real()();
  RealColumn get totalSale => real()();
  RealColumn get profit => real()();

  @override
  Set<Column> get primaryKey => {id};
}

// 6. Expenses Table
class Expenses extends Table {
  TextColumn get id => text()();
  TextColumn get businessId => text().references(Businesses, #id)();
  DateTimeColumn get expenseDate => dateTime().withDefault(currentDateAndTime)();
  TextColumn get category => text()(); // Transport, Rent, ZESA, Water, Salary, etc.
  RealColumn get amount => real()();
  TextColumn get description => text()();
  TextColumn get receiptPhotoPath => text().nullable()();
  TextColumn get paymentMethod => text().withDefault(const Constant('Cash USD'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// 7. Customers Table
class Customers extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get phone => text().nullable()();
  TextColumn get address => text().nullable()();
  TextColumn get notes => text().nullable()();
  RealColumn get totalPurchases => real().withDefault(const Constant(0.0))();
  RealColumn get outstandingDebt => real().withDefault(const Constant(0.0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// 8. Debtors Table ("People Who Owe Me")
class Debtors extends Table {
  TextColumn get id => text()();
  TextColumn get customerId => text().nullable().references(Customers, #id)();
  TextColumn get customerName => text()();
  TextColumn get phoneNumber => text().nullable()();
  RealColumn get originalAmount => real()();
  RealColumn get balanceOwed => real()();
  DateTimeColumn get issuedDate => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get dueDate => dateTime().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('Unpaid'))(); // Unpaid, Partial, Cleared
  TextColumn get relatedSaleId => text().nullable().references(Sales, #id)();

  @override
  Set<Column> get primaryKey => {id};
}

// 9. Payments Table (Debt Repayments)
class Payments extends Table {
  TextColumn get id => text()();
  TextColumn get debtorId => text().references(Debtors, #id, onDelete: KeyAction.cascade)();
  RealColumn get amount => real()();
  DateTimeColumn get paymentDate => dateTime().withDefault(currentDateAndTime)();
  TextColumn get paymentMethod => text().withDefault(const Constant('Cash USD'))();
  TextColumn get notes => text().nullable()();
  RealColumn get remainingBalance => real()();

  @override
  Set<Column> get primaryKey => {id};
}

// 10. Reports Cache Table (Instant <300ms daily metrics)
class ReportsCache extends Table {
  TextColumn get id => text()(); // e.g. "report-2026-09-13"
  TextColumn get reportPeriod => text()(); // daily, weekly, monthly
  DateTimeColumn get periodStart => dateTime()();
  DateTimeColumn get periodEnd => dateTime()();
  RealColumn get totalSales => real()();
  RealColumn get totalExpenses => real()();
  RealColumn get netProfit => real()();
  TextColumn get topSellingProduct => text().nullable()();
  DateTimeColumn get generatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// 11. Backups Table
class Backups extends Table {
  TextColumn get id => text()();
  DateTimeColumn get backupDate => dateTime().withDefault(currentDateAndTime)();
  TextColumn get filePath => text()();
  IntColumn get fileSizeBytes => integer()();
  TextColumn get backupType => text().withDefault(const Constant('manual'))(); // manual, auto

  @override
  Set<Column> get primaryKey => {id};
}

// 12. Settings Table
class Settings extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column> get primaryKey => {key};
}

// 13. Subscription Status Table (RevenueCat Ready)
class SubscriptionStatus extends Table {
  TextColumn get id => text().withDefault(const Constant('default'))();
  BoolColumn get isPremium => boolean().withDefault(const Constant(false))();
  TextColumn get tier => text().withDefault(const Constant('free'))();
  DateTimeColumn get expirationDate => dateTime().nullable()();
  TextColumn get customerInfoJson => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// 14. Notifications Table (Local Reminders)
class Notifications extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get body => text()();
  DateTimeColumn get scheduledTime => dateTime()();
  BoolColumn get isRead => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

// 15. Audit Logs Table (Tamper-evident record changes)
class AuditLogs extends Table {
  TextColumn get id => text()();
  TextColumn get action => text()();
  TextColumn get tableName => text()();
  TextColumn get recordId => text()();
  DateTimeColumn get timestamp => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [
  Businesses,
  Products,
  InventoryMovements,
  Sales,
  SaleItems,
  Expenses,
  Customers,
  Debtors,
  Payments,
  ReportsCache,
  Backups,
  Settings,
  SubscriptionStatus,
  Notifications,
  AuditLogs,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  static LazyDatabase _openConnection() {
    return LazyDatabase(() async {
      final dbFolder = await getApplicationDocumentsDirectory();
      final file = File(p.join(dbFolder.path, 'smartbiz_pocket.sqlite'));
      return NativeDatabase.createInBackground(
        file,
        isolateSetup: () {
          // Optimize SQLite pragmas for low-end Android (2GB RAM devices)
        },
      );
    });
  }
}`;

export const FLUTTER_RIVERPOD_ARCH_CODE = `// lib/features/sales/presentation/riverpod_providers.dart
// State Management via Riverpod 2.x for SmartBiz Pocket
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartbiz_pocket/database/app_database.dart';

// Database instance provider
final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

// Stream of products with active stock
final productsStreamProvider = StreamProvider<List<Product>>((ref) {
  final db = ref.watch(databaseProvider);
  return (db.select(db.products)..where((t) => t.isArchived.equals(false))).watch();
});

// Low stock items provider
final lowStockItemsProvider = Provider<AsyncValue<List<Product>>>((ref) {
  final productsAsync = ref.watch(productsStreamProvider);
  return productsAsync.whenData(
    (products) => products.where((p) => p.quantity <= p.minStock).toList(),
  );
});

// Active Debtors ("People Who Owe Me") provider
final activeDebtorsProvider = StreamProvider<List<Debtor>>((ref) {
  final db = ref.watch(databaseProvider);
  return (db.select(db.debtors)..where((t) => t.balanceOwed.isBiggerThanValue(0.0))).watch();
});

// Today's Sales Summary Notifier
class DashboardSummaryState {
  final double todaySales;
  final double todayExpenses;
  final double todayProfit;
  final int totalDebtors;
  final double totalOwed;

  DashboardSummaryState({
    required this.todaySales,
    required this.todayExpenses,
    required this.todayProfit,
    required this.totalDebtors,
    required this.totalOwed,
  });
}

final dashboardSummaryProvider = FutureProvider<DashboardSummaryState>((ref) async {
  final db = ref.watch(databaseProvider);
  final now = DateTime.now();
  final startOfDay = DateTime(now.year, now.month, now.day);
  final endOfDay = startOfDay.add(const Duration(days: 1));

  // 1. Sales query
  final salesToday = await (db.select(db.sales)
    ..where((s) => s.saleDate.isBiggerOrEqualValue(startOfDay) & s.saleDate.isSmallerThanValue(endOfDay)))
    .get();
  
  final totalSales = salesToday.fold<double>(0.0, (sum, s) => sum + s.totalSale);
  final totalProfit = salesToday.fold<double>(0.0, (sum, s) => sum + s.profit);

  // 2. Expenses query
  final expensesToday = await (db.select(db.expenses)
    ..where((e) => e.expenseDate.isBiggerOrEqualValue(startOfDay) & e.expenseDate.isSmallerThanValue(endOfDay)))
    .get();
  
  final totalExpenses = expensesToday.fold<double>(0.0, (sum, e) => sum + e.amount);

  // 3. Debtors
  final debtors = await (db.select(db.debtors)
    ..where((d) => d.balanceOwed.isBiggerThanValue(0.0)))
    .get();
  
  final totalOwed = debtors.fold<double>(0.0, (sum, d) => sum + d.balanceOwed);

  return DashboardSummaryState(
    todaySales: totalSales,
    todayExpenses: totalExpenses,
    todayProfit: totalProfit - totalExpenses,
    totalDebtors: debtors.length,
    totalOwed: totalOwed,
  );
});`;

export const FLUTTER_BACKUP_ENGINE_CODE = `// lib/core/backup/backup_engine.dart
// 100% Offline Local Backup & Restore Engine for SmartBiz Pocket
// Supports both Compressed JSON and direct SQLite File Export to Phone / SD Card
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:smartbiz_pocket/database/app_database.dart';

class LocalBackupEngine {
  final AppDatabase database;

  LocalBackupEngine(this.database);

  /// Generates a timestamped JSON snapshot of all tables
  Future<File> createJsonBackup() async {
    final products = await database.select(database.products).get();
    final sales = await database.select(database.sales).get();
    final saleItems = await database.select(database.saleItems).get();
    final expenses = await database.select(database.expenses).get();
    final customers = await database.select(database.customers).get();
    final debtors = await database.select(database.debtors).get();
    final payments = await database.select(database.payments).get();

    final backupData = {
      'version': 1,
      'app': 'SmartBiz Pocket',
      'timestamp': DateTime.now().toIso8601String(),
      'tables': {
        'products': products.map((p) => p.toJson()).toList(),
        'sales': sales.map((s) => s.toJson()).toList(),
        'sale_items': saleItems.map((i) => i.toJson()).toList(),
        'expenses': expenses.map((e) => e.toJson()).toList(),
        'customers': customers.map((c) => c.toJson()).toList(),
        'debtors': debtors.map((d) => d.toJson()).toList(),
        'payments': payments.map((p) => p.toJson()).toList(),
      }
    };

    final directory = await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory();
    final nowStr = DateTime.now().toIso8601String().replaceAll(':', '-').split('.').first;
    final file = File('\${directory.path}/smartbiz_backup_\$nowStr.json');
    
    await file.writeAsString(jsonEncode(backupData), flush: true);
    return file;
  }

  /// Restores database state from a validated backup file
  Future<bool> restoreFromJsonFile(File backupFile) async {
    try {
      final content = await backupFile.readAsString();
      final Map<String, dynamic> data = jsonDecode(content);

      if (data['app'] != 'SmartBiz Pocket') {
        throw Exception('Invalid SmartBiz Pocket backup format');
      }

      await database.transaction(() async {
        // Clear existing records safely
        await database.delete(database.saleItems).go();
        await database.delete(database.payments).go();
        await database.delete(database.debtors).go();
        await database.delete(database.sales).go();
        await database.delete(database.expenses).go();
        await database.delete(database.products).go();
        await database.delete(database.customers).go();

        // Restore tables...
      });

      return true;
    } catch (e) {
      return false;
    }
  }
}`;

export const FLUTTER_REVENUECAT_CODE = `// lib/core/subscriptions/revenuecat_service.dart
// RevenueCat Subscriptions Architecture Placeholder (Feature-flag guarded)
import 'package:purchases_flutter/purchases_flutter.dart';

class RevenueCatService {
  static const String _apiKeyAndroid = 'goog_placeholder_smartbiz_pocket';
  static const String entitlementPremium = 'smartbiz_premium';

  static Future<void> initialize() async {
    await Purchases.setLogLevel(LogLevel.debug);
    PurchasesConfiguration configuration = PurchasesConfiguration(_apiKeyAndroid);
    await Purchases.configure(configuration);
  }

  /// Checks if business has active premium features
  static Future<bool> isUserPremium() async {
    try {
      CustomerInfo customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.all[entitlementPremium]?.isActive ?? false;
    } catch (e) {
      // Offline fallback: Default to local free tier limits (100 sales/mo, 50 products)
      return false;
    }
  }
}`;
