from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import RegistrationRequestModel


class RegistrationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_all(self, status: str | None = None):
        stmt = select(RegistrationRequestModel).order_by(RegistrationRequestModel.submission_date.desc())
        if status:
            stmt = stmt.where(RegistrationRequestModel.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
