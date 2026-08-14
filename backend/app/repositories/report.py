import json
from sqlalchemy.orm import Session

from app.models.report import Report


class ReportRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_investigation_id(self, inv_id: int) -> Report | None:
        return self.session.query(Report).filter(Report.investigation_id == inv_id).first()

    def upsert(self, inv_id: int, report_data: dict) -> Report:
        existing = self.get_by_investigation_id(inv_id)
        if existing:
            existing.report_json = json.dumps(report_data)
            self.session.flush()
            return existing
        report = Report(
            investigation_id=inv_id,
            report_json=json.dumps(report_data),
        )
        self.session.add(report)
        self.session.flush()
        return report
