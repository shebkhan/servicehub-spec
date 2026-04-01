class User {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String role;
  final String? tenantId;
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    required this.role,
    this.tenantId,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      fullName: json['full_name'] ?? json['fullName'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'customer',
      tenantId: json['tenant_id'] ?? json['tenantId'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'full_name': fullName,
    'phone': phone,
    'role': role,
    'tenant_id': tenantId,
  };
}

class Service {
  final String id;
  final String name;
  final String description;
  final double price;
  final int duration;
  final String categoryId;
  final String? categoryName;
  final String? imageUrl;
  final bool isActive;

  Service({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.duration,
    required this.categoryId,
    this.categoryName,
    this.imageUrl,
    this.isActive = true,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: (json['price'] is String) 
          ? double.parse(json['price']) 
          : (json['price'] as num?)?.toDouble() ?? 0.0,
      duration: json['duration'] ?? 60,
      categoryId: json['category_id'] ?? json['categoryId'] ?? '',
      categoryName: json['category_name'] ?? json['categoryName'],
      imageUrl: json['image_url'] ?? json['imageUrl'],
      isActive: json['is_active'] ?? json['isActive'] ?? true,
    );
  }
}

class ServiceCategory {
  final String id;
  final String name;
  final String? description;
  final String? icon;
  final String? imageUrl;
  final int serviceCount;

  ServiceCategory({
    required this.id,
    required this.name,
    this.description,
    this.icon,
    this.imageUrl,
    this.serviceCount = 0,
  });

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      icon: json['icon'],
      imageUrl: json['image_url'] ?? json['imageUrl'],
      serviceCount: json['service_count'] ?? json['serviceCount'] ?? 0,
    );
  }
}

class Provider {
  final String id;
  final String userId;
  final String businessName;
  final String? bio;
  final String? profileImage;
  final double avgRating;
  final int totalReviews;
  final int totalJobs;
  final bool isVerified;
  final String? workingHours;
  final double? distance;

  Provider({
    required this.id,
    required this.userId,
    required this.businessName,
    this.bio,
    this.profileImage,
    this.avgRating = 0.0,
    this.totalReviews = 0,
    this.totalJobs = 0,
    this.isVerified = false,
    this.workingHours,
    this.distance,
  });

  factory Provider.fromJson(Map<String, dynamic> json) {
    return Provider(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'] ?? '',
      businessName: json['business_name'] ?? json['businessName'] ?? 'Provider',
      bio: json['bio'],
      profileImage: json['profile_image'] ?? json['profileImage'],
      avgRating: (json['avg_rating'] ?? json['avgRating'] ?? 0).toDouble(),
      totalReviews: json['total_reviews'] ?? json['totalReviews'] ?? 0,
      totalJobs: json['total_jobs'] ?? json['totalJobs'] ?? 0,
      isVerified: json['is_verified'] ?? json['isVerified'] ?? false,
      workingHours: json['working_hours'] ?? json['workingHours'],
      distance: json['distance']?.toDouble(),
    );
  }
}

class BookingSlot {
  final String time;
  final bool available;

  BookingSlot({required this.time, required this.available});

  factory BookingSlot.fromJson(Map<String, dynamic> json) {
    return BookingSlot(
      time: json['time'],
      available: json['available'] ?? true,
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final String customerId;
  final String? providerId;
  final String status;
  final DateTime scheduledDate;
  final String scheduledTime;
  final String serviceAt;
  final Address? address;
  final List<OrderItem> items;
  final double subtotal;
  final double discount;
  final double total;
  final double creditUsed;
  final double cashCollected;
  final DateTime createdAt;
  final Provider? provider;
  final Customer? customer;

  Order({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    this.providerId,
    required this.status,
    required this.scheduledDate,
    required this.scheduledTime,
    required this.serviceAt,
    this.address,
    required this.items,
    required this.subtotal,
    this.discount = 0,
    required this.total,
    this.creditUsed = 0,
    this.cashCollected = 0,
    required this.createdAt,
    this.provider,
    this.customer,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['order_number'] ?? json['orderNumber'] ?? '',
      customerId: json['customer_id'] ?? json['customerId'] ?? '',
      providerId: json['provider_id'] ?? json['providerId'],
      status: json['status'] ?? 'pending',
      scheduledDate: DateTime.parse(json['scheduled_date'] ?? json['scheduledDate'] ?? DateTime.now().toIso8601String()),
      scheduledTime: json['scheduled_time'] ?? json['scheduledTime'] ?? '',
      serviceAt: json['service_at'] ?? json['serviceAt'] ?? 'home',
      address: json['address'] != null ? Address.fromJson(json['address']) : null,
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => OrderItem.fromJson(e))
          .toList() ?? [],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      creditUsed: (json['credit_used'] ?? json['creditUsed'] ?? 0).toDouble(),
      cashCollected: (json['cash_collected'] ?? json['cashCollected'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
      provider: json['provider'] != null ? Provider.fromJson(json['provider']) : null,
      customer: json['customer'] != null ? Customer.fromJson(json['customer']) : null,
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'dispatched': return 'Provider En Route';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}

class OrderItem {
  final String id;
  final String serviceId;
  final String? serviceName;
  final int quantity;
  final double price;

  OrderItem({
    required this.id,
    required this.serviceId,
    this.serviceName,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? '',
      serviceId: json['service_id'] ?? json['serviceId'] ?? '',
      serviceName: json['service_name'] ?? json['serviceName'],
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}

class Address {
  final double lat;
  final double lng;
  final String fullAddress;
  final String? instructions;

  Address({
    required this.lat,
    required this.lng,
    required this.fullAddress,
    this.instructions,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      lat: (json['lat'] ?? 0).toDouble(),
      lng: (json['lng'] ?? 0).toDouble(),
      fullAddress: json['full_address'] ?? json['fullAddress'] ?? '',
      instructions: json['instructions'],
    );
  }

  Map<String, dynamic> toJson() => {
    'lat': lat,
    'lng': lng,
    'full_address': fullAddress,
    'instructions': instructions,
  };
}

class Customer {
  final String id;
  final String userId;
  final String? defaultAddress;

  Customer({
    required this.id,
    required this.userId,
    this.defaultAddress,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'] ?? '',
      defaultAddress: json['default_address'] ?? json['defaultAddress'],
    );
  }
}

class WalletBalance {
  final double balance;
  final double totalSpent;
  final List<WalletTransaction> recentTransactions;

  WalletBalance({
    required this.balance,
    this.totalSpent = 0,
    this.recentTransactions = const [],
  });

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    return WalletBalance(
      balance: (json['balance'] ?? 0).toDouble(),
      totalSpent: (json['total_spent'] ?? json['totalSpent'] ?? 0).toDouble(),
      recentTransactions: (json['recent_transactions'] as List<dynamic>?)
          ?.map((e) => WalletTransaction.fromJson(e))
          .toList() ?? [],
    );
  }
}

class WalletTransaction {
  final String id;
  final String type;
  final double amount;
  final String description;
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'],
      type: json['type'] ?? 'unknown',
      amount: (json['amount'] ?? 0).toDouble(),
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
