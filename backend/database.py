from typing import List, Dict, Any

# Simulating a DB table
# columns: id, storage_blob (Column A), blind_index (Column B)
fake_db: List[Dict[str, Any]] = []

def add_record(record: Dict[str, Any]) -> None:
    fake_db.append(record)

def get_all_records() -> List[Dict[str, Any]]:
    return fake_db

def count_records() -> int:
    return len(fake_db)
