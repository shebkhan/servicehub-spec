import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService instance = ApiService._internal();
  factory ApiService() => instance;
  ApiService._internal();

  final _storage = const FlutterSecureStorage();
  late Dio _dio;
  
  // Update this to your production URL
  static const String baseUrl = 'https://api.servicehub-spec.vercel.app/api/v1';

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired - try to refresh
          await _storage.delete(key: 'access_token');
        }
        return handler.next(error);
      },
    ));
  }

  void setToken(String token) {
    _storage.write(key: 'access_token', value: token);
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return _dio.put(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) async {
    return _dio.delete(path);
  }
}
