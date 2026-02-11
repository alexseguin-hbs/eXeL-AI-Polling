from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def paginate(
    db: AsyncSession, query: Select, page: int = 1, page_size: int = 20
) -> tuple[list, int]:
    """Apply pagination to a query. Returns (items, total_count)."""
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size))
    items = list(result.scalars().all())

    return items, total
