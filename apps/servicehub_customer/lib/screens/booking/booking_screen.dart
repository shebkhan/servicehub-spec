import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import 'package:intl/intl.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _currentStep = 0;
  Service? _selectedService;
  Provider? _selectedProvider;
  DateTime _selectedDate = DateTime.now();
  String? _selectedTime;
  String _serviceAt = 'home';
  Address? _address;
  bool _isLoading = false;
  
  List<Provider> _providers = [];
  List<BookingSlot> _slots = [];

  final _addressController = TextEditingController();
  final _instructionsController = TextEditingController();

  @override
  void dispose() {
    _addressController.dispose();
    _instructionsController.dispose();
    super.dispose();
  }

  Future<void> _loadProviders() async {
    if (_selectedService == null) return;
    try {
      final res = await ApiService.instance.get('/providers', queryParameters: {'service_id': _selectedService!.id});
      if (mounted) {
        setState(() {
          _providers = (res.data as List).map((e) => Provider.fromJson(e)).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading providers: $e');
    }
  }

  Future<void> _loadSlots() async {
    if (_selectedProvider == null) return;
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final res = await ApiService.instance.get('/providers/${_selectedProvider!.id}/availability', queryParameters: {'date': dateStr});
      if (mounted) {
        setState(() {
          _slots = (res.data['slots'] as List).map((e) => BookingSlot.fromJson(e)).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading slots: $e');
    }
  }

  Future<void> _createBooking() async {
    if (_selectedProvider == null || _selectedTime == null || _address == null) return;
    
    setState(() => _isLoading = true);
    try {
      await ApiService.instance.post('/orders', data: {
        'provider_id': _selectedProvider!.id,
        'scheduled_date': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'scheduled_time': _selectedTime,
        'service_at': _serviceAt,
        'address': _address!.toJson(),
        'items': [{'service_id': _selectedService!.id, 'quantity': 1}],
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pushReplacementNamed(context, '/orders');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create booking'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Service')),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 3) {
            if (_currentStep == 0 && _selectedService == null) return;
            if (_currentStep == 1 && _selectedProvider == null) {
              _loadProviders();
            }
            if (_currentStep == 2 && _selectedTime == null) return;
            setState(() => _currentStep++);
          } else {
            _createBooking();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) setState(() => _currentStep--);
        },
        controlsBuilder: (context, details) {
          return Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                ElevatedButton(
                  onPressed: details.onStepContinue,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0066CC)),
                  child: Text(_currentStep == 3 ? (_isLoading ? 'Processing...' : 'Confirm Booking') : 'Continue'),
                ),
                const SizedBox(width: 8),
                if (_currentStep > 0)
                  TextButton(onPressed: details.onStepCancel, child: const Text('Back')),
              ],
            ),
          );
        },
        steps: [
          Step(
            title: const Text('Select Service'),
            content: _buildServiceStep(),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Select Provider'),
            content: _buildProviderStep(),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Select Date & Time'),
            content: _buildDateTimeStep(),
            isActive: _currentStep >= 2,
            state: _currentStep > 2 ? StepState.complete : StepState.indexed,
          ),
          Step(
            title: const Text('Confirm'),
            content: _buildConfirmStep(),
            isActive: _currentStep >= 3,
            state: StepState.indexed,
          ),
        ],
      ),
    );
  }

  Widget _buildServiceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedService != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0066CC).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Color(0xFF0066CC)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_selectedService!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text('\$${_selectedService!.price.toStringAsFixed(2)} • ${_selectedService!.duration} min'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ] else
          const Text('Please select a service from the services page'),
      ],
    );
  }

  Widget _buildProviderStep() {
    if (_providers.isEmpty) {
      return Column(
        children: [
          const Text('Available providers will appear here'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadProviders,
            child: const Text('Load Providers'),
          ),
        ],
      );
    }
    
    return Column(
      children: _providers.map((provider) {
        return GestureDetector(
          onTap: () => setState(() => _selectedProvider = provider),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: _selectedProvider?.id == provider.id ? const Color(0xFF0066CC) : Colors.grey.shade300, width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: const Color(0xFF0066CC).withOpacity(0.1),
                  child: Text(provider.businessName[0], style: const TextStyle(color: Color(0xFF0066CC), fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(provider.businessName, style: const TextStyle(fontWeight: FontWeight.bold)),
                          if (provider.isVerified) const Icon(Icons.verified, color: Colors.blue, size: 16),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          Text(' ${provider.avgRating.toStringAsFixed(1)} (${provider.totalReviews})'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDateTimeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Date', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: _selectedDate,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 30)),
            );
            if (date != null) {
              setState(() {
                _selectedDate = date;
                _selectedTime = null;
              });
              _loadSlots();
            }
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today),
                const SizedBox(width: 12),
                Text(DateFormat('EEEE, MMMM d, yyyy').format(_selectedDate)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Select Time', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (_slots.isEmpty)
          const Text('Select a date to see available times')
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _slots.map((slot) {
              final isSelected = _selectedTime == slot.time;
              return GestureDetector(
                onTap: slot.available ? () => setState(() => _selectedTime = slot.time) : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF0066CC) : (slot.available ? Colors.grey.shade200 : Colors.grey.shade100),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(slot.time, style: TextStyle(color: isSelected ? Colors.white : (slot.available ? Colors.black : Colors.grey))),
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildConfirmStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Booking Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _buildSummaryRow('Service', _selectedService?.name ?? ''),
        _buildSummaryRow('Provider', _selectedProvider?.businessName ?? ''),
        _buildSummaryRow('Date', DateFormat('MMM d, yyyy').format(_selectedDate)),
        _buildSummaryRow('Time', _selectedTime ?? ''),
        _buildSummaryRow('Location', _serviceAt == 'home' ? 'At Home' : 'At Store'),
        const Divider(),
        _buildSummaryRow('Total', '\$${_selectedService?.price.toStringAsFixed(2) ?? '0.00'}', isBold: true),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
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
}
