import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Order> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    try {
      final res = await ApiService.instance.get('/orders');
      if (mounted) {
        setState(() {
          _orders = (res.data as List).map((e) => Order.fromJson(e)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Order> get _upcomingOrders => _orders.where((o) => ['pending', 'confirmed', 'dispatched'].contains(o.status)).toList();
  List<Order> get _ongoingOrders => _orders.where((o) => o.status == 'in_progress').toList();
  List<Order> get _completedOrders => _orders.where((o) => ['completed', 'cancelled'].contains(o.status)).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Ongoing'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOrderList(_upcomingOrders),
                _buildOrderList(_ongoingOrders),
                _buildOrderList(_completedOrders),
              ],
            ),
    );
  }

  Widget _buildOrderList(List<Order> orders) {
    if (orders.isEmpty) {
      return const Center(child: Text('No orders found'));
    }
    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          return _OrderCard(order: orders[index]);
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/order-detail', arguments: order),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(order.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                      _StatusBadge(status: order.status),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...order.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text('${item.serviceName ?? 'Service'} x${item.quantity}', style: const TextStyle(fontSize: 14)),
                  )),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(DateFormat('MMM d, yyyy').format(order.scheduledDate), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(width: 16),
                      const Icon(Icons.access_time, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(order.scheduledTime, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total: \$${order.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const Icon(Icons.arrow_forward_ios, size: 14),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'pending': color = Colors.orange; break;
      case 'confirmed': color = Colors.blue; break;
      case 'dispatched': color = Colors.purple; break;
      case 'in_progress': color = Colors.teal; break;
      case 'completed': color = Colors.green; break;
      case 'cancelled': color = Colors.red; break;
      default: color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
