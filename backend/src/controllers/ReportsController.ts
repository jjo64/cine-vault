import { Request, Response } from "express"
import {
  getReportDetailService,
  listReportsService,
  moderateReportService,
} from "../services/reports.services.js"
import type { ListReportsQueryDTO } from "../schemas/reports.js"
import type { z } from "zod"
import type { reportIdParamsSchema } from "../schemas/reports.js"

type ReportIdParams = z.infer<typeof reportIdParamsSchema>

export const getReports = async (req: Request, res: Response) => {
  const payload = await listReportsService(
    req.query as unknown as ListReportsQueryDTO
  )
  res.json(payload)
}

export const getReportById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ReportIdParams
  const payload = await getReportDetailService(id)
  res.json(payload)
}

export const moderateReport = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ReportIdParams
  const payload = await moderateReportService(req.user!.user_id, id, req.body)
  res.json(payload)
}
