from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Lumora Backend"
    api_prefix: str = "/api"
    app_env: str = "development"
    port: int = 8000

    mssql_host: str
    mssql_port: int = 1433
    mssql_database: str
    mssql_username: str
    mssql_password: str
    mssql_driver: str = "ODBC Driver 17 for SQL Server"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

