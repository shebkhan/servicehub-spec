import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/services/services_screen.dart';
import 'screens/booking/booking_screen.dart';
import 'screens/orders/orders_screen.dart';
import 'screens/orders/order_detail_screen.dart';
import 'screens/wallet/wallet_screen.dart';
import 'screens/profile/profile_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: ServiceHubCustomerApp(),
    ),
  );
}

class ServiceHubCustomerApp extends ConsumerStatefulWidget {
  const ServiceHubCustomerApp({super.key});

  @override
  ConsumerState<ServiceHubCustomerApp> createState() => _ServiceHubCustomerAppState();
}

class _ServiceHubCustomerAppState extends ConsumerState<ServiceHubCustomerApp> {
  final _storage = const FlutterSecureStorage();
  bool _isLoading = true;
  String? _token;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      ApiService.instance.setToken(token);
      ref.read(authProvider.notifier).checkAuth();
    }
    setState(() {
      _token = token;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ServiceHub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0066CC),
          brightness: Brightness.light,
        ),
        fontFamily: 'Inter',
      ),
      home: _isLoading
          ? const SplashScreen()
          : _token != null
              ? const HomeScreen()
              : const LoginScreen(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
        '/services': (context) => const ServicesScreen(),
        '/booking': (context) => const BookingScreen(),
        '/orders': (context) => const OrdersScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
