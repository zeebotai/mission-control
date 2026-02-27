from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # NOTE: can be overridden via env var DATABASE_URL.
    database_url: str = "sqlite:///./mission_control.db"
    poll_interval_seconds: int = 5


settings = Settings()
