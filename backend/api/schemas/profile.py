"""Profile schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


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

    # keycloak_id is a UUID column (as_uuid=True) on the model; coerce to str so
    # response validation doesn't 500.
    @field_validator("keycloak_id", mode="before")
    @classmethod
    def _uuid_to_str(cls, v: object) -> str:
        return str(v)
    display_name: str
    timezone: str
    avatar_url: str | None
    brand_color: str
    bio: str | None
    created_at: datetime
    updated_at: datetime
