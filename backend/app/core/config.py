from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(min_length=1)
    jwt_secret: str = Field(min_length=1)
    cors_origin: str = Field(min_length=1)

    # Auth / JWT
    jwt_algorithm: str = "HS256"
    access_token_expire_days: int = 7
    auth_cookie_name: str = "access_token"
    auth_cookie_secure: bool = False  # dev default; production must override to True
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    @field_validator("cors_origin", mode="before")
    @classmethod
    def strip_cors_origin(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().rstrip("/")
        return v


settings = Settings()  # type: ignore[call-arg]
