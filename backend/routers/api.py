from fastapi import APIRouter, HTTPException
from ..schemas import SubmissionPayload, SearchQuery
from ..services import crypto
from .. import database, config

router = APIRouter()

@router.get("/public-key")
def get_public_key():
    return {"public_key": config.SERVER_PUBLIC_KEY_PEM.decode('utf-8')}

@router.post("/submit")
def submit_data(payload: SubmissionPayload):
    try:
        national_id = crypto.decrypt_ingress_payload(payload)
        
        # Prepare Record
        record_id = database.count_records() + 1
        record = {
            "id": record_id,
            "storage_blob": crypto.encrypt_for_storage(national_id),
            "blind_index": crypto.compute_blind_index(national_id)
        }
        
        database.add_record(record)
        return {"status": "success", "record_id": record_id}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/search")
def search_national_id(query: SearchQuery):
    search_hash = crypto.compute_blind_index(query.national_id)
    all_records = database.get_all_records()
    
    # Exact Match Lookup on Blind Index
    matches = [r["id"] for r in all_records if r["blind_index"] == search_hash]
    
    if not matches:
        raise HTTPException(status_code=404, detail="Not found")

    return {"count": len(matches), "matches": matches}
