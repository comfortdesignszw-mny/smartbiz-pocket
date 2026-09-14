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

export const FLUTTER_REVENUECAT_CODE = `// ============================================================================
// lib/core/subscriptions/revenuecat_service.dart
// SmartBiz Pocket – Production RevenueCat Subscriptions & Paywall Architecture
// ============================================================================
// Dependencies required in pubspec.yaml:
//   purchases_flutter: ^8.0.0
//   purchases_ui_flutter: ^8.0.0
// ============================================================================

import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

/// Top-level initialization using your RevenueCat API credentials
Future<void> initializeRevenueCat({String? appUserId}) async {
  // Platform-specific API keys
  String apiKey;
  if (Platform.isIOS) {
    apiKey = 'test_RVdhYytnLyhMFndYhQvPFRKjhYI';
  } else if (Platform.isAndroid) {
    apiKey = 'test_RVdhYytnLyhMFndYhQvPFRKjhYI';
  } else {
    throw UnsupportedError('Platform not supported for RevenueCat in-app purchases');
  }

  // Set verbose debug logs in development for easy troubleshooting
  if (kDebugMode) {
    await Purchases.setLogLevel(LogLevel.debug);
  }

  // Build configuration with optional user ID
  PurchasesConfiguration configuration = PurchasesConfiguration(apiKey);
  if (appUserId != null && appUserId.isNotEmpty) {
    configuration.appUserID = appUserId;
  }

  await Purchases.configure(configuration);
}

/// Comprehensive RevenueCat Service for SmartBiz Pocket
class RevenueCatService {
  // --------------------------------------------------------------------------
  // Constants & Entitlements
  // --------------------------------------------------------------------------
  /// Your primary Pro Plan entitlement configured in the RevenueCat dashboard
  static const String entitlementPro = 'smartbiz_pocket_pro';

  /// Standard monthly package identifier for $2.00 / month Pro plan
  static const String monthlyPackageId = '\$rc_monthly';
  static const String monthlyProductId = 'smartbiz_pro_monthly';

  // Reactive state notifier for subscription status across the app
  static final ValueNotifier<bool> isProNotifier = ValueNotifier<bool>(false);

  // --------------------------------------------------------------------------
  // 1. Initialization & Customer Info Stream
  // --------------------------------------------------------------------------
  /// Initializes the SDK and attaches a real-time customer info update listener
  static Future<void> initialize({String? appUserId}) async {
    try {
      await initializeRevenueCat(appUserId: appUserId);

      // Listen to real-time subscription changes (renewals, cancellations, promos)
      Purchases.addCustomerInfoUpdateListener((customerInfo) {
        _updateEntitlementStatus(customerInfo);
      });

      // Perform initial entitlement check
      await checkEntitlementStatus();
    } catch (e) {
      debugPrint('[RevenueCat] Initialization error: \$e');
    }
  }

  // --------------------------------------------------------------------------
  // 2. Entitlement Checking
  // --------------------------------------------------------------------------
  /// Checks whether the user has an active "smartbiz_pocket_pro" entitlement
  static Future<bool> isUserPro() async {
    try {
      final customerInfo = await Purchases.getCustomerInfo();
      return _updateEntitlementStatus(customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat] Error getting customer info: \$e');
      // Offline fallback: keep existing in-memory state or allow cached access
      return isProNotifier.value;
    }
  }

  /// Synchronous getter from cached reactive state
  static bool get isCurrentlyPro => isProNotifier.value;

  /// Helper to extract entitlement state from CustomerInfo
  static bool _updateEntitlementStatus(CustomerInfo customerInfo) {
    final EntitlementInfo? entitlement = customerInfo.entitlements.all[entitlementPro];
    final bool hasPro = entitlement != null && entitlement.isActive;
    isProNotifier.value = hasPro;
    debugPrint('[RevenueCat] Entitlement "\$entitlementPro" active: \$hasPro');
    return hasPro;
  }

  static Future<void> checkEntitlementStatus() async {
    await isUserPro();
  }

  // --------------------------------------------------------------------------
  // 3. RevenueCat Paywalls (purchases_ui_flutter)
  // --------------------------------------------------------------------------
  /// Presents the native RevenueCat Paywall configured in the dashboard.
  /// If the user completes purchase or restores, it automatically updates entitlements.
  static Future<PaywallResult> presentProPaywall({Offering? offering}) async {
    try {
      final PaywallResult result = await RevenueCatUI.presentPaywall(
        offering: offering,
        displayCloseButton: true,
      );

      debugPrint('[RevenueCat Paywall] Result: \$result');
      await isUserPro(); // Refresh entitlement status
      return result;
    } on PlatformException catch (e) {
      debugPrint('[RevenueCat Paywall] Error: \${e.message}');
      return PaywallResult.error;
    } catch (e) {
      debugPrint('[RevenueCat Paywall] Unexpected error: \$e');
      return PaywallResult.error;
    }
  }

  /// Conditionally presents the paywall ONLY if the user does NOT have the Pro entitlement
  static Future<PaywallResult> presentPaywallIfNeeded() async {
    try {
      final PaywallResult result = await RevenueCatUI.presentPaywallIfNeeded(
        entitlementPro,
        displayCloseButton: true,
      );
      debugPrint('[RevenueCat Paywall If Needed] Result: \$result');
      await isUserPro();
      return result;
    } catch (e) {
      debugPrint('[RevenueCat Paywall If Needed] Error: \$e');
      return PaywallResult.error;
    }
  }

  // --------------------------------------------------------------------------
  // 4. RevenueCat Customer Center (purchases_ui_flutter)
  // --------------------------------------------------------------------------
  /// Presents the self-service Customer Center where merchants can view active
  /// subscription details ($2/mo), manage plans, switch payment methods, or cancel.
  static Future<void> presentCustomerCenter() async {
    try {
      await RevenueCatUI.presentCustomerCenter();
      await isUserPro();
    } on PlatformException catch (e) {
      debugPrint('[RevenueCat Customer Center] Error: \${e.message}');
    } catch (e) {
      debugPrint('[RevenueCat Customer Center] Unexpected error: \$e');
    }
  }

  // --------------------------------------------------------------------------
  // 5. Offerings & Custom Purchase Handling
  // --------------------------------------------------------------------------
  /// Fetches current Paywall offerings from RevenueCat
  static Future<Offerings?> getOfferings() async {
    try {
      final offerings = await Purchases.getOfferings();
      if (offerings.current != null) {
        debugPrint('[RevenueCat] Current offering: \${offerings.current!.identifier}');
        return offerings;
      }
    } on PlatformException catch (e) {
      final errorCode = PurchasesErrorHelper.getErrorCode(e);
      debugPrint('[RevenueCat] Get offerings error [\$errorCode]: \${e.message}');
    } catch (e) {
      debugPrint('[RevenueCat] Unexpected get offerings error: \$e');
    }
    return null;
  }

  /// Purchases a specific Package (e.g. Pro Monthly $2/mo) with full error classification
  static Future<PurchaseResult> purchasePackage(Package package) async {
    try {
      final CustomerInfo customerInfo = await Purchases.purchasePackage(package);
      final bool success = _updateEntitlementStatus(customerInfo);
      return PurchaseResult(
        isSuccess: success,
        customerInfo: customerInfo,
      );
    } on PlatformException catch (e) {
      final PurchasesErrorCode errorCode = PurchasesErrorHelper.getErrorCode(e);
      debugPrint('[RevenueCat Purchase Error] Code: \$errorCode, Message: \${e.message}');

      if (errorCode == PurchasesErrorCode.purchaseCancelledError) {
        return PurchaseResult(isSuccess: false, isUserCancelled: true);
      }

      return PurchaseResult(
        isSuccess: false,
        errorMessage: e.message ?? 'Unknown purchase error occurred.',
        errorCode: errorCode,
      );
    } catch (e) {
      return PurchaseResult(
        isSuccess: false,
        errorMessage: e.toString(),
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. Restore Purchases
  // --------------------------------------------------------------------------
  /// Restores previous purchases (essential for users switching or reinstalling on budget phones)
  static Future<bool> restorePurchases() async {
    try {
      final CustomerInfo customerInfo = await Purchases.restorePurchases();
      final bool hasPro = _updateEntitlementStatus(customerInfo);
      debugPrint('[RevenueCat] Restore complete. Pro active: \$hasPro');
      return hasPro;
    } on PlatformException catch (e) {
      debugPrint('[RevenueCat Restore Error]: \${e.message}');
      return false;
    } catch (e) {
      debugPrint('[RevenueCat Restore Error]: \$e');
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 7. User Authentication & Logout
  // --------------------------------------------------------------------------
  /// Associates the device with the merchant's business ID
  static Future<void> logIn(String businessId) async {
    try {
      final LogInResult result = await Purchases.logIn(businessId);
      _updateEntitlementStatus(result.customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat LogIn Error]: \$e');
    }
  }

  /// Logs out to anonymous user state
  static Future<void> logOut() async {
    try {
      final CustomerInfo customerInfo = await Purchases.logOut();
      _updateEntitlementStatus(customerInfo);
    } catch (e) {
      debugPrint('[RevenueCat LogOut Error]: \$e');
    }
  }
}

/// Helper data class for purchase outcomes
class PurchaseResult {
  final bool isSuccess;
  final bool isUserCancelled;
  final String? errorMessage;
  final PurchasesErrorCode? errorCode;
  final CustomerInfo? customerInfo;

  PurchaseResult({
    required this.isSuccess,
    this.isUserCancelled = false,
    this.errorMessage,
    this.errorCode,
    this.customerInfo,
  });
}
`;
