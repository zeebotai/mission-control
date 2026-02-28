from app.api.routers.cronobuilds.followups import router as followups_router
from app.api.routers.cronobuilds.importer import router as importer_router
from app.api.routers.cronobuilds.leads import router as leads_router

# Both routers share the same prefix (/cronobuilds)
router = leads_router
router.include_router(importer_router)
router.include_router(followups_router)

__all__ = ["router"]
