from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, services, providers, orders, payments, tenants, reviews

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ServiceHub API",
    description="Multi-Tenant Services Marketplace API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(services.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "ServiceHub API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/health")
async def api_health_check():
    return {"status": "healthy", "version": "1.0.0"}
