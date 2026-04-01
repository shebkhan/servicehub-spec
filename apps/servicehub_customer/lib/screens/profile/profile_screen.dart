import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: const Color(0xFF0066CC).withOpacity(0.1),
                    child: Text(
                      (authState.user?.fullName ?? 'U')[0].toUpperCase(),
                      style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Color(0xFF0066CC)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(authState.user?.fullName ?? 'User', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(authState.user?.email ?? '', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(authState.user?.phone ?? '', style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Menu Items
            _MenuItem(icon: Icons.person_outline, title: 'Edit Profile', onTap: () {}),
            _MenuItem(icon: Icons.location_on_outlined, title: 'My Addresses', onTap: () {}),
            _MenuItem(icon: Icons.payment_outlined, title: 'Payment Methods', onTap: () {}),
            _MenuItem(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () {}),
            _MenuItem(icon: Icons.security_outlined, title: 'Privacy & Security', onTap: () {}),
            _MenuItem(icon: Icons.help_outline, title: 'Help & Support', onTap: () {}),
            _MenuItem(icon: Icons.info_outline, title: 'About', onTap: () {}),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                  }
                },
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Logout', style: TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8)],
      ),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF0066CC)),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
