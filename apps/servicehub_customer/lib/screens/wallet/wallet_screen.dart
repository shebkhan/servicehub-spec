import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  WalletBalance? _wallet;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    try {
      final res = await ApiService.instance.get('/wallet/balance');
      if (mounted) {
        setState(() {
          _wallet = WalletBalance.fromJson(res.data);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadWallet,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Balance Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0066CC), Color(0xFF0052A3)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Available Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                          const SizedBox(height: 8),
                          Text('\$${_wallet?.balance.toStringAsFixed(2) ?? '0.00'}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Total Spent: \$${_wallet?.totalSpent.toStringAsFixed(2) ?? '0.00'}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Top Up Options
                    const Text('Top Up', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _TopUpOption(amount: 50, bonus: 12.50, onTap: () => _handleTopUp(50)),
                        const SizedBox(width: 12),
                        _TopUpOption(amount: 100, bonus: 25, onTap: () => _handleTopUp(100)),
                        const SizedBox(width: 12),
                        _TopUpOption(amount: 200, bonus: 50, onTap: () => _handleTopUp(200)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Transactions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Recent Transactions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        TextButton(onPressed: () {}, child: const Text('See All')),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_wallet?.recentTransactions.isEmpty ?? true)
                      const Center(child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Text('No transactions yet'),
                      ))
                    else
                      ...(_wallet?.recentTransactions.map((tx) => _TransactionTile(transaction: tx)) ?? []),
                  ],
                ),
              ),
            ),
    );
  }

  void _handleTopUp(double amount) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Top Up Confirmation', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('Amount: \$${amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 8),
            Text('Bonus: \$0.00', style: const TextStyle(color: Colors.green)),
            const SizedBox(height: 8),
            const Text('Total Credit: \$${amount.toStringAsFixed(2)}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0066CC))),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  // Implement Stripe payment
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Payment feature requires Stripe integration')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0066CC),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Proceed to Payment', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopUpOption extends StatelessWidget {
  final double amount;
  final double bonus;
  final VoidCallback onTap;
  const _TopUpOption({required this.amount, required this.bonus, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF0066CC)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Text('\$${amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0066CC))),
              if (bonus > 0) Text('+\$${bonus.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Colors.green)),
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final WalletTransaction transaction;
  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.type == 'credit' || transaction.type == 'topup';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: (isCredit ? Colors.green : Colors.red).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(isCredit ? Icons.add : Icons.remove, color: isCredit ? Colors.green : Colors.red),
      ),
      title: Text(transaction.description),
      subtitle: Text(transaction.createdAt.toString().substring(0, 10)),
      trailing: Text(
        '${isCredit ? '+' : '-'}\$${transaction.amount.toStringAsFixed(2)}',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isCredit ? Colors.green : Colors.red,
        ),
      ),
    );
  }
}
