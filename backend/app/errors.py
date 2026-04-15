"""Error contract enforcement.

The architecture spec mandates a flat error envelope:

    { "detail": "Human-readable message", "code": "MACHINE_READABLE_CODE" }

FastAPI's default wraps a dict `detail` in another `detail` key. This
module exposes `api_error()` for routers to raise domain errors with the
correct shape, plus `install_exception_handlers()` to coerce FastAPI's
own 422 validation errors and uncaught HTTPExceptions into the contract.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.requests import Request


class ApiError(HTTPException):
    """HTTPException that carries a machine-readable `code`."""

    def __init__(self, status_code: int, message: str, code: str) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.code = code


def api_error(status_code: int, message: str, code: str) -> ApiError:
    """Convenience constructor for the architecture's error envelope."""
    return ApiError(status_code=status_code, message=message, code=code)


def install_exception_handlers(app: FastAPI) -> None:
    """Register handlers that enforce the flat `{detail, code}` envelope."""

    @app.exception_handler(ApiError)
    async def _api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail), "code": exc.code},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        first_message = "Invalid request"
        if errors:
            err = errors[0]
            loc = ".".join(str(part) for part in err.get("loc", ()) if part != "body")
            msg = err.get("msg", first_message)
            first_message = f"{loc}: {msg}" if loc else msg
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": first_message, "code": "VALIDATION_ERROR"},
        )
