import 'package:flutter/material.dart';
import '../../models/models.dart';
import 'package:intl/intl.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final order = ModalRoute.of(context)!.settings.arguments as Order;

    return Scaffold(
      appBar: AppBar(title: Text('Order ${order.orderNumber}')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _getStatusColor(order.status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(_getStatusIcon(order.status), size: 48, color: _getStatusColor(order.status)),
                  const SizedBox(height: 12),
                  Text(order.statusDisplay, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _getStatusColor(order.status))),
                  const SizedBox(height: 4),
                  Text(_getStatusMessage(order.status), style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Provider Info
            if (order.provider != null) ...[
              const Text('Provider', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: const Color(0xFF0066CC).withOpacity(0.1),
                      child: Text(order.provider!.businessName[0], style: const TextStyle(color: Color(0xFF0066CC), fontWeight: FontWeight.bold, fontSize: 20)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(order.provider!.businessName, style: const TextStyle(fontWeight: FontWeight.bold)),
                              if (order.provider!.isVerified) const Icon(Icons.verified, color: Colors.blue, size: 16),
                            ],
                          ),
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              Text(' ${order.provider!.avgRating.toStringAsFixed(1)}'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.call, color: Color(0xFF0066CC)), onPressed: () {}),
                    IconButton(icon: const Icon(Icons.chat, color: Color(0xFF0066CC)), onPressed: () {}),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Booking Details
            const Text('Booking Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  _buildDetailRow(Icons.calendar_today, 'Date', DateFormat('EEEE, MMMM d, yyyy').format(order.scheduledDate)),
                  _buildDetailRow(Icons.access_time, 'Time', order.scheduledTime),
                  _buildDetailRow(Icons.location_on, 'Service At', order.serviceAt == 'home' ? 'At Home' : 'At Store'),
                  if (order.address != null) _buildDetailRow(Icons.home, 'Address', order.address!.fullAddress),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Services
            const Text('Services', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${item.serviceName ?? 'Service'} x${item.quantity}'),
                      Text('\$${item.price.toStringAsFixed(2)}'),
                    ],
                  ),
                )).toList(),
              ),
            ),
            const SizedBox(height: 24),

            // Payment
            const Text('Payment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  _buildDetailRow('Subtotal', '\$${order.subtotal.toStringAsFixed(2)}'),
                  if (order.discount > 0) _buildDetailRow('Discount', '-\$${order.discount.toStringAsFixed(2)}'),
                  const Divider(),
                  _buildDetailRow('Total', '\$${order.total.toStringAsFixed(2)}', isBold: true),
                ],
              ),
            ),

            if (order.status == 'pending' || order.status == 'confirmed') ...[
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Cancel order logic
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Cancel Order'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'dispatched': return Colors.purple;
      case 'in_progress': return Colors.teal;
      case 'completed': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending': return Icons.hourglass_empty;
      case 'confirmed': return Icons.check_circle;
      case 'dispatched': return Icons.delivery_dining;
      case 'in_progress': return Icons.cleaning_services;
      case 'completed': return Icons.done_all;
      case 'cancelled': return Icons.cancel;
      default: return Icons.info;
    }
  }

  String _getStatusMessage(String status) {
    switch (status) {
      case 'pending': return 'Waiting for provider confirmation';
      case 'confirmed': return 'Provider confirmed your booking';
      case 'dispatched': return 'Provider is on the way';
      case 'in_progress': return 'Service is being performed';
      case 'completed': return 'Service completed successfully';
      case 'cancelled': return 'This order was cancelled';
      default: return '';
    }
  }
}
