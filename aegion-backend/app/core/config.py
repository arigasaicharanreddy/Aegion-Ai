from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Aegion AI Python Engine"
    DATABASE_URL: str = "postgresql+asyncpg://aegion:aegion_dev_password@localhost:5432/aegion"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""
    JWT_SECRET: str = "change-me-in-production"
    SUPER_ADMIN_EMAIL: str = "arigasaicharan@gmail.com"
    AEGION_SUPER_ADMIN_INITIAL_PASSWORD: str = ""
    GOOGLE_CLIENT_ID: str = ""
    AEGION_SHEETS_SPREADSHEET_ID: str = ""
    WHATSAPP_WABA_ID: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = ""
    WHATSAPP_APP_SECRET: str = ""
    EMAIL_PROVIDER: str = "Gmail API"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
