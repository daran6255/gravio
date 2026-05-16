from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_offer import PlacementOffer, OfferResponse, JoiningStatus
from app.repositories.placement_offer_repository import PlacementOfferRepository
from app.schemas.placement_offer import PlacementOfferCreate, PlacementOfferUpdate
from app.services.candidate_document_service import CandidateDocumentService
from uuid import UUID


class PlacementOfferService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = PlacementOfferRepository(db)

    async def create_offer(self, offer_in: PlacementOfferCreate) -> PlacementOffer:
        offer = PlacementOffer(**offer_in.model_dump())
        self.db.add(offer)
        await self.db.commit()
        await self.db.refresh(offer)
        return offer

    async def update_offer(self, id: int, offer_in: PlacementOfferUpdate) -> Optional[PlacementOffer]:
        offer = await self.repository.get(id)
        if not offer:
            return None
        
        update_data = offer_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(offer, key, value)
        
        offer.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(offer)
        return offer

    async def get_by_mapping(self, mapping_id: int) -> Optional[PlacementOffer]:
        offer = await self.repository.get_by_mapping(mapping_id)
        if offer and not offer.offer_letter_id and offer.offer_letter_url:
            # Self-heal: Try to find the document ID by path
            from sqlalchemy import select
            from app.models.candidate_document import CandidateDocument
            stmt = select(CandidateDocument).where(CandidateDocument.file_path == offer.offer_letter_url)
            result = await self.db.execute(stmt)
            doc = result.scalars().first()
            if doc:
                offer.offer_letter_id = doc.id
                await self.db.commit()
                await self.db.refresh(offer)
        return offer

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementOffer]:
        offers = await self.repository.get_by_candidate(candidate_id)
        for offer in offers:
            if not offer.offer_letter_id and offer.offer_letter_url:
                # Self-heal
                from sqlalchemy import select
                from app.models.candidate_document import CandidateDocument
                stmt = select(CandidateDocument).where(CandidateDocument.file_path == offer.offer_letter_url)
                result = await self.db.execute(stmt)
                doc = result.scalars().first()
                if doc:
                    offer.offer_letter_id = doc.id
                    await self.db.commit()
        return offers

    async def record_response(self, id: int, response: OfferResponse, remarks: Optional[str] = None) -> Optional[PlacementOffer]:
        offer_update = PlacementOfferUpdate(
            candidate_response=response,
            response_date=date.today(),
            rejection_reason=remarks if response == OfferResponse.REJECTED else None
        )
        return await self.update_offer(id, offer_update)

    async def record_joining(self, id: int, status: JoiningStatus, joining_date: Optional[date] = None) -> Optional[PlacementOffer]:
        offer_update = PlacementOfferUpdate(
            joining_status=status,
            actual_joining_date=joining_date if status == JoiningStatus.JOINED else None
        )
        return await self.update_offer(id, offer_update)

    async def upload_offer_letter(
        self,
        mapping_id: int,
        file: any, # UploadFile
        user_id: int,
        offered_ctc: Optional[float] = None,
        joining_date: Optional[date] = None,
        offered_designation: Optional[str] = None,
        remarks: Optional[str] = None
    ) -> PlacementOffer:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.placement_mapping import PlacementMapping
        
        # Fetch mapping with candidate and job_role loaded
        stmt = (
            select(PlacementMapping)
            .where(PlacementMapping.id == mapping_id)
            .options(
                selectinload(PlacementMapping.candidate),
                selectinload(PlacementMapping.job_role)
            )
        )
        result = await self.db.execute(stmt)
        mapping = result.scalars().first()
        
        if not mapping:
            raise Exception("Placement mapping not found")

        # 1. Upload to Candidate Documents
        doc_service = CandidateDocumentService(self.db)
        doc = await doc_service.upload_document(
            candidate_public_id=mapping.candidate.public_id,
            document_type="offer_letter",
            file=file,
            description=f"Offer Letter for {mapping.job_role.title}",
            uploaded_by_id=user_id
        )

        # 2. Update/Create PlacementOffer
        offer = await self.get_by_mapping(mapping_id)
        if offer:
            offer.offer_letter_url = doc.file_path
            offer.offer_letter_id = doc.id
            if offered_ctc: offer.offered_ctc = offered_ctc
            if joining_date: offer.joining_date = joining_date
            if offered_designation: offer.offered_designation = offered_designation
            offer.updated_at = datetime.utcnow()
        else:
            offer = PlacementOffer(
                mapping_id=mapping_id,
                candidate_id=mapping.candidate_id,
                job_role_id=mapping.job_role_id,
                offer_letter_url=doc.file_path,
                offer_letter_id=doc.id,
                offered_ctc=offered_ctc,
                joining_date=joining_date,
                offered_designation=offered_designation,
                offered_by_id=user_id,
                offer_date=date.today()
            )
            self.db.add(offer)

        await self.db.commit()
        await self.db.refresh(offer)

        # 3. Update pipeline status to offer_made
        from app.services.placement_pipeline_service import PlacementPipelineService
        from app.models.placement_mapping import PlacementStatus
        
        # Construct detailed history remark if details are provided
        detail_parts = []
        if offered_ctc: detail_parts.append(f"CTC: {offered_ctc} LPA")
        if offered_designation: detail_parts.append(f"Designation: {offered_designation}")
        if joining_date: detail_parts.append(f"Joining: {joining_date.strftime('%d-%b-%Y')}")
        
        detail_remark = " | ".join(detail_parts)
        final_remarks = remarks
        if detail_remark:
            final_remarks = f"{remarks}\n({detail_remark})" if remarks else detail_remark
        
        # Add document info to remarks for timeline tracking
        doc_remark = f"DocumentID: {doc.id} | Document: {doc.file_path}"
        final_remarks = f"{final_remarks}\n{doc_remark}" if final_remarks else doc_remark

        pipeline_service = PlacementPipelineService(self.db)
        await pipeline_service.update_status(
            mapping_id=mapping_id,
            to_status=PlacementStatus.OFFER_MADE,
            changed_by_id=user_id,
            remarks=final_remarks
        )

        return offer
