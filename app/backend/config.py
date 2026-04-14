from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://euai:euai@localhost:5432/euaiact"
    secret_key: str = "change-me-in-production-use-32-chars-min"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8 hours
    rules_path: str = "rules/eu_ai_act.yml"

    class Config:
        env_file = ".env"


settings = Settings()
