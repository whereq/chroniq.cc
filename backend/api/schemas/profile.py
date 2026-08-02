"""Profile schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=64, pattern=r"^[a-z0-9][a-z0-9-]*$")
    display_name: str | None = Field(default=None, max_length=120)
    timezone: str | None = Field(default=None, max_length=64)
    avatar_url: str | None = Field(default=None, max_length=512)
    brand_color: str | None = Field(default=None, max_length=16)
    bio: str | None = Field(default=None, max_length=500)


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    keycloak_id: str
    username: str
    display_name: str
    timezone: str
    avatar_url: str | None
    brand_color: str
    bio: str | None
    created_at: datetime
    updated_at: datetime
