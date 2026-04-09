import { Request, Response } from "express"
import {
  getReportDetailService,
  listReportsService,
  moderateReportService,
} from "../services/reports.services.js"
import { ListReportsQueryDTO } from "../schemas/reports.js"

export const getReports = async (req: Request, res: Response) => {
  const payload = await listReportsService(req.query as unknown as ListReportsQueryDTO)
  res.json(payload)
}

export const getReportById = async (req: Request, res: Response) => {
  const payload = await getReportDetailService(Number(req.params.id))
  res.json(payload)
}

export const moderateReport = async (req: Request, res: Response) => {
  const payload = await moderateReportService(req.user!.user_id, Number(req.params.id), req.body)
  res.json(payload)
}
